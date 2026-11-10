import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { CourseExplanationError, SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { isAncestor } from '@/lib/git-sim/history/ancestry'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { copyObjects } from '@/lib/git-sim/remote/remoteTransfer'
import { listBranchTipObjectIds, listObjectIds, measureObjects, pushProgressLines, summarizePack } from '@/lib/git-sim/remote/packReport'
import { connectToRemote } from '@/lib/git-sim/remote/remoteConnection'
import { readUpstream, setUpstream } from '@/lib/git-sim/remote/upstream'
import { firstRemoteName } from '@/lib/git-sim/remote/fetchFromRemote'
import { describeRejection, type RejectionReason } from '@/lib/git-sim/remote/pushRejection'
import { repositoryNameAt } from '@/lib/git-sim/github/hostedRepository'
import type { CommandContext, CommandOutput, GitSubcommand, RemoteLink } from '@/lib/git-sim/types'

const NO_PUSH_DESTINATION = [
  'fatal: No configured push destination.',
  'Either specify the URL from the command-line or configure a remote repository using',
  '',
  '    git remote add <name> <url>',
  '',
  'and then push using the remote name',
  '',
  '    git push <name>',
].join('\n')

const BASE_OBJECTS_REVISITED = 2
const DELETE_FLAGS = ['-d', '--delete']
const ONE_BRANCH_AT_A_TIME = 'This practice terminal pushes one branch at a time. Run git push once for each branch.'

function pullRequestOffer(url: string, branch: string): string[] {
  const repository = repositoryNameAt(url)
  if (!repository || branch === 'main') return []
  return [
    'remote: ',
    `remote: Create a pull request for '${branch}' on GitHub by visiting:`,
    `remote:      https://github.com/${repository}/pull/new/${branch}`,
    'remote: ',
  ]
}

type PushTarget = {
  remoteName: string
  branch: string | null
  label: string
  remoteBranch: string
  forced: boolean
}

type Refspec = Pick<PushTarget, 'branch' | 'label' | 'remoteBranch' | 'forced'>

type ForceMode = 'none' | 'force' | 'lease'

type RefTips = {
  local: string
  remote: string | null
  lastFetched: string | null
}

function noUpstream(branch: string, remoteName: string): string {
  return [
    `fatal: The current branch ${branch} has no upstream branch.`,
    'To push the current branch and set the remote as upstream, use',
    '',
    `    git push --set-upstream ${remoteName} ${branch}`,
    '',
    'To have this happen automatically for branches without a tracking',
    "upstream, see 'push.autoSetupRemote' in 'git help config'.",
  ].join('\n')
}

function upstreamNameMismatch(remoteName: string, upstreamBranch: string): string {
  return [
    'fatal: The upstream branch of your current branch does not match',
    'the name of your current branch.  To push to the upstream branch',
    'on the remote, use',
    '',
    `    git push ${remoteName} HEAD:${upstreamBranch}`,
    '',
    'To push to the branch of the same name on the remote, use',
    '',
    `    git push ${remoteName} HEAD`,
    '',
    "To choose either option permanently, see push.default in 'git help config'.",
    '',
    'To avoid automatically configuring an upstream branch when its name',
    "won't match the local branch, see option 'simple' of branch.autoSetupMerge",
    "in 'git help config'.",
    '',
  ].join('\n')
}

function refName(name: string): string {
  return name.replace(/^refs\/heads\//, '')
}

function parseRefspec(typed: string, current: string): Refspec {
  const forced = typed.startsWith('+')
  const body = forced ? typed.slice(1) : typed
  const colon = body.indexOf(':')
  const source = refName(colon === -1 ? body : body.slice(0, colon))
  const destination = refName(colon === -1 ? body : body.slice(colon + 1))

  if (source === '') return { branch: null, label: destination, remoteBranch: destination, forced }
  const branch = source === 'HEAD' ? current : source
  return { branch, label: source, remoteBranch: destination === 'HEAD' ? current : destination, forced }
}

function deletion(name: string): Refspec {
  const remoteBranch = refName(name)
  return { branch: null, label: remoteBranch, remoteBranch, forced: false }
}

async function pushTarget(
  ctx: CommandContext,
  dir: string,
  line: CommandLine,
  current: string,
): Promise<PushTarget> {
  const [named, ...refspecs] = line.operands
  const remoteName = named ?? (await firstRemoteName(ctx, dir))
  if (!remoteName) throw new SandboxError(NO_PUSH_DESTINATION)
  if (refspecs.length > 1) throw new CourseExplanationError(ONE_BRANCH_AT_A_TIME)

  const [refspec] = refspecs
  if (line.has(...DELETE_FLAGS)) {
    if (!refspec) throw new SandboxError("fatal: --delete doesn't make sense without any refs")
    return { remoteName, ...deletion(refspec) }
  }
  if (refspec) return { remoteName, ...parseRefspec(refspec, current) }

  const upstream = await readUpstream(ctx, dir, current)
  if (!upstream) throw new SandboxError(noUpstream(current, remoteName))
  const unforced = { branch: current, label: current, forced: false }
  if (upstream.remote !== remoteName) return { remoteName, remoteBranch: current, ...unforced }
  if (upstream.branch !== current) throw new SandboxError(upstreamNameMismatch(remoteName, upstream.branch))
  return { remoteName: upstream.remote, remoteBranch: upstream.branch, ...unforced }
}

function forceModeOf(line: CommandLine, target: PushTarget): ForceMode {
  if (line.has('--force-with-lease')) return 'lease'
  if (line.has('--force', '-f') || target.forced) return 'force'
  return 'none'
}

function failedPush(url: string, reason: string): SandboxError {
  return new SandboxError([reason, `error: failed to push some refs to '${url}'`].join('\n'))
}

async function deleteRemoteBranch(
  ctx: CommandContext,
  dir: string,
  link: RemoteLink,
  target: PushTarget,
): Promise<CommandOutput[]> {
  const { remoteBranch, remoteName } = target
  if (!(await refOid(ctx, link.dir, `refs/heads/${remoteBranch}`))) {
    throw failedPush(link.url, `error: unable to delete '${remoteBranch}': remote ref does not exist`)
  }
  if (remoteBranch === (await currentBranch(ctx, link.dir))) {
    throw failedPush(
      link.url,
      [`To ${link.url}`, ` ! [remote rejected] ${remoteBranch} (refusing to delete the current branch: refs/heads/${remoteBranch})`].join('\n'),
    )
  }

  await git.deleteRef({ fs: gitFs(ctx.fs), dir: link.dir, ref: `refs/heads/${remoteBranch}` })
  const trackingRef = `refs/remotes/${remoteName}/${remoteBranch}`
  if (await refOid(ctx, dir, trackingRef)) await git.deleteRef({ fs: gitFs(ctx.fs), dir, ref: trackingRef })
  return say([`To ${link.url}`, ` - [deleted]         ${remoteBranch}`].join('\n'))
}

async function canFastForward(
  ctx: CommandContext,
  dir: string,
  localOid: string,
  remoteOid: string,
): Promise<boolean> {
  return isAncestor(ctx, dir, remoteOid, localOid)
}

async function hasObject(ctx: CommandContext, dir: string, oid: string): Promise<boolean> {
  try {
    await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
    return true
  } catch {
    return false
  }
}

async function rejectionReason(
  ctx: CommandContext,
  dir: string,
  tips: RefTips,
  mode: ForceMode,
): Promise<RejectionReason | null> {
  if (!tips.remote) return null
  if (mode === 'force') return null
  if (mode === 'lease') return tips.remote === tips.lastFetched ? null : 'stale info'
  if (await canFastForward(ctx, dir, tips.local, tips.remote)) return null
  return (await hasObject(ctx, dir, tips.remote)) ? 'non-fast-forward' : 'fetch first'
}

async function refLine(
  ctx: CommandContext,
  dir: string,
  tips: RefTips,
  names: string,
): Promise<string> {
  if (!tips.remote) return ` * [new branch]      ${names}`
  const range = `${shortOid(tips.remote)}..${shortOid(tips.local)}`
  if (await canFastForward(ctx, dir, tips.local, tips.remote)) return `   ${range}  ${names}`
  return ` + ${shortOid(tips.remote)}...${shortOid(tips.local)} ${names} (forced update)`
}

export const push: GitSubcommand = {
  requiresRepo: true,
  options: { flags: ['-u', '--set-upstream', '-f', '--force', '--force-with-lease', '-q', '--quiet', ...DELETE_FLAGS] },
  run: async (line, ctx, dir) => {
    const outputs = await pushBranch(line, ctx, dir)
    return line.has('-q', '--quiet') ? outputs.filter((output) => output.stream === 'stderr') : outputs
  },
}

async function sendObjects(ctx: CommandContext, dir: string, remoteDir: string): Promise<string[]> {
  const alreadyThere = new Set(await listObjectIds(ctx, remoteDir))
  const deltaBases = await listBranchTipObjectIds(ctx, remoteDir)
  const sent = await measureObjects(ctx, dir, (await listObjectIds(ctx, dir)).filter((oid) => !alreadyThere.has(oid)))
  await copyObjects(ctx, dir, remoteDir)

  const enumerated = sent.length + (alreadyThere.size > 0 ? BASE_OBJECTS_REVISITED : 0)
  return pushProgressLines(await summarizePack(ctx, remoteDir, sent, deltaBases), enumerated)
}

async function moveRefs(ctx: CommandContext, dir: string, remoteDir: string, target: PushTarget, value: string): Promise<void> {
  const fs = gitFs(ctx.fs)
  await git.writeRef({ fs, dir: remoteDir, ref: `refs/heads/${target.remoteBranch}`, value, force: true })
  await git.writeRef({ fs, dir, ref: `refs/remotes/${target.remoteName}/${target.remoteBranch}`, value, force: true })
}

async function pushBranch(line: CommandLine, ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const branchName = await currentBranch(ctx, dir)
  if (!branchName) throw new SandboxError("fatal: this course can't push a detached HEAD.")

  const target = await pushTarget(ctx, dir, line, branchName)
  const { remoteName, branch, label, remoteBranch } = target
  const link = await connectToRemote(ctx, dir, remoteName)
  const { url, dir: remoteDir } = link
  if (branch === null) return deleteRemoteBranch(ctx, dir, link, target)

  const localOid = await refOid(ctx, dir, `refs/heads/${branch}`)
  if (!localOid) throw failedPush(url, `error: src refspec ${label} does not match any`)

  const tips: RefTips = {
    local: localOid,
    remote: await refOid(ctx, remoteDir, `refs/heads/${remoteBranch}`),
    lastFetched: await refOid(ctx, dir, `refs/remotes/${remoteName}/${remoteBranch}`),
  }
  const reason = await rejectionReason(ctx, dir, tips, forceModeOf(line, target))
  if (reason) throw new SandboxError(describeRejection(url, label, remoteBranch, reason))

  const tracked = line.has('-u', '--set-upstream')
  const upstream = tracked ? [`branch '${branch}' set up to track '${remoteName}/${remoteBranch}'.`] : []
  if (tracked) await setUpstream(ctx, dir, branch, { remote: remoteName, branch: remoteBranch })
  if (tips.remote === localOid) return say([...upstream, 'Everything up-to-date'].join('\n'))

  const updated = await refLine(ctx, dir, tips, `${label} -> ${remoteBranch}`)
  const progress = await sendObjects(ctx, dir, remoteDir)
  await moveRefs(ctx, dir, remoteDir, target, localOid)

  const pullRequestLink = tips.remote === null ? pullRequestOffer(url, remoteBranch) : []
  return say([...progress, ...pullRequestLink, `To ${url}`, updated, ...upstream].join('\n'))
}
