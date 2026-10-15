import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { copyObjects, countObjects } from '@/lib/git-sim/remote/remoteTransfer'
import { connectToRemote } from '@/lib/git-sim/remote/remoteConnection'
import { readUpstream, setUpstream } from '@/lib/git-sim/remote/upstream'
import { firstRemoteName } from '@/lib/git-sim/remote/fetchFromRemote'
import { describeRejection, type RejectionReason } from '@/lib/git-sim/remote/pushRejection'
import { repositoryNameAt } from '@/lib/git-sim/github/hostedRepository'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

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

function transferReport(written: number, remoteHadHistory: boolean): string[] {
  const enumerated = written + (remoteHadHistory ? BASE_OBJECTS_REVISITED : 0)
  return [
    `Enumerating objects: ${enumerated}, done.`,
    `Counting objects: 100% (${enumerated}/${enumerated}), done.`,
    `Writing objects: 100% (${written}/${written}), done.`,
  ]
}

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
  branch: string
  remoteBranch: string
}

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

async function pushTarget(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
  current: string,
): Promise<PushTarget> {
  const [named, refspec] = operandsOf(args)
  const remoteName = named ?? (await firstRemoteName(ctx, dir))
  if (!remoteName) throw new SandboxError(NO_PUSH_DESTINATION)
  if (refspec) return { remoteName, branch: refspec, remoteBranch: refspec }

  const upstream = await readUpstream(ctx, dir, current)
  if (!upstream) throw new SandboxError(noUpstream(current, remoteName))
  if (upstream.remote !== remoteName) return { remoteName, branch: current, remoteBranch: current }
  return { remoteName: upstream.remote, branch: current, remoteBranch: upstream.branch }
}

function forceModeOf(args: readonly string[]): ForceMode {
  if (hasFlag(args, '--force-with-lease')) return 'lease'
  if (hasFlag(args, '--force', '-f')) return 'force'
  return 'none'
}

async function canFastForward(
  ctx: CommandContext,
  dir: string,
  localOid: string,
  remoteOid: string,
): Promise<boolean> {
  if (localOid === remoteOid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid: localOid, ancestor: remoteOid, depth: -1 })
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
  run: async (args, ctx, dir) => {
    const branchName = await currentBranch(ctx, dir)
    if (!branchName) throw new SandboxError("fatal: this course can't push a detached HEAD.")

    const { remoteName, branch, remoteBranch } = await pushTarget(ctx, dir, args, branchName)
    const { url, dir: remoteDir } = await connectToRemote(ctx, dir, remoteName)
    const localOid = await refOid(ctx, dir, `refs/heads/${branch}`)
    if (!localOid) throw new SandboxError(`error: src refspec ${branch} does not match any`)

    const tips: RefTips = {
      local: localOid,
      remote: await refOid(ctx, remoteDir, `refs/heads/${remoteBranch}`),
      lastFetched: await refOid(ctx, dir, `refs/remotes/${remoteName}/${remoteBranch}`),
    }
    const reason = await rejectionReason(ctx, dir, tips, forceModeOf(args))
    if (reason) throw new SandboxError(describeRejection(url, branch, remoteBranch, reason))

    const tracked = hasFlag(args, '-u', '--set-upstream')
    const upstream = tracked
      ? [`branch '${branch}' set up to track '${remoteName}/${remoteBranch}'.`]
      : []
    if (tracked) await setUpstream(ctx, dir, branch, { remote: remoteName, branch: remoteBranch })

    if (tips.remote === localOid) return say([...upstream, 'Everything up-to-date'].join('\n'))

    const updated = await refLine(ctx, dir, tips, `${branch} -> ${remoteBranch}`)
    const objectsBefore = await countObjects(ctx, remoteDir)
    await copyObjects(ctx, dir, remoteDir)
    const written = (await countObjects(ctx, remoteDir)) - objectsBefore
    await git.writeRef({
      fs: gitFs(ctx.fs),
      dir: remoteDir,
      ref: `refs/heads/${remoteBranch}`,
      value: localOid,
      force: true,
    })
    await git.writeRef({
      fs: gitFs(ctx.fs),
      dir,
      ref: `refs/remotes/${remoteName}/${remoteBranch}`,
      value: localOid,
      force: true,
    })

    const pullRequestLink = tips.remote === null ? pullRequestOffer(url, remoteBranch) : []
    return say(
      [...transferReport(written, objectsBefore > 0), ...pullRequestLink, `To ${url}`, updated, ...upstream].join('\n'),
    )
  },
}
