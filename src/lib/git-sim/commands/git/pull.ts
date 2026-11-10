import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, stderr, stdout } from '@/lib/git-sim/output'
import { currentBranch, headOid, refOid } from '@/lib/git-sim/history/repository'
import { isLocalUpstream, readUpstream, trackingRefOf, type Upstream } from '@/lib/git-sim/remote/upstream'
import { fetchFromRemote, fetchHeadLine, resolveRemoteName } from '@/lib/git-sim/remote/fetchFromRemote'
import { refuseMergeWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { mergeInto } from '@/lib/git-sim/merge/mergeInto'
import { divergedRefusal, PULL_STRATEGY_FLAGS, pullStrategyOf } from '@/lib/git-sim/remote/pullStrategy'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type Fetched = { header: string; oid: string | null; ref: string; title: string }

async function onlyRemoteName(ctx: CommandContext, dir: string): Promise<string> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.length === 1 && remotes[0] ? remotes[0].remote : '<remote>'
}

function noTrackingInformation(branch: string, remoteName: string): string {
  return [
    'There is no tracking information for the current branch.',
    'Please specify which branch you want to merge with.',
    'See git-pull(1) for details.',
    '',
    '    git pull <remote> <branch>',
    '',
    'If you wish to set tracking information for this branch you can do so with:',
    '',
    `    git branch --set-upstream-to=${remoteName}/<branch> ${branch}`,
  ].join('\n')
}

function notTheDefaultRemote(remoteName: string): string {
  return [
    `You asked to pull from the remote '${remoteName}', but did not specify`,
    'a branch. Because this is not the default configured remote',
    'for your current branch, you must specify a branch on the command line.',
  ].join('\n')
}

async function hasDiverged(ctx: CommandContext, dir: string, fetched: string): Promise<boolean> {
  const head = await headOid(ctx, dir)
  if (!head || head === fetched) return false

  const fs = gitFs(ctx.fs)
  const ahead = await git.isDescendent({ fs, dir, oid: head, ancestor: fetched, depth: -1 })
  const behind = await git.isDescendent({ fs, dir, oid: fetched, ancestor: head, depth: -1 })
  return !ahead && !behind
}

async function pullSource(
  ctx: CommandContext,
  dir: string,
  line: CommandLine,
  current: string,
): Promise<Upstream> {
  const [named, branch] = line.operands
  if (named && branch) return { remote: named, branch }

  const upstream = await readUpstream(ctx, dir, current)
  if (!upstream) {
    await resolveRemoteName(ctx, dir)
    throw new SandboxError(noTrackingInformation(current, await onlyRemoteName(ctx, dir)))
  }
  if (named && named !== upstream.remote) throw new SandboxError(notTheDefaultRemote(named))
  return upstream
}

async function fetchSource(ctx: CommandContext, dir: string, source: Upstream, branchNamed: boolean): Promise<Fetched> {
  const ref = trackingRefOf(source)
  if (isLocalUpstream(source)) {
    return {
      header: ['From .', fetchHeadLine(source.branch)].join('\n'),
      oid: await refOid(ctx, dir, ref),
      ref,
      title: `Merge branch '${source.branch}'`,
    }
  }

  const result = await fetchFromRemote(ctx, dir, source.remote, source.branch, branchNamed)
  return { header: result.header, oid: result.fetchedOid, ref, title: `Merge branch '${source.branch}' of ${result.url}` }
}

export const pull: GitSubcommand = {
  requiresRepo: true,
  options: { flags: PULL_STRATEGY_FLAGS },
  run: async (line, ctx, dir) => {
    const branchName = await currentBranch(ctx, dir)
    if (!branchName) throw new SandboxError("fatal: this course can't pull onto a detached HEAD.")
    await refuseMergeWhileMerging(ctx, dir, 'Pulling')

    const source = await pullSource(ctx, dir, line, branchName)
    const fetched = await fetchSource(ctx, dir, source, line.operands.length > 1)
    if (!fetched.oid) throw new SandboxError(`fatal: couldn't find remote ref ${source.branch}`)

    if (await hasDiverged(ctx, dir, fetched.oid)) {
      const refusal = divergedRefusal(await pullStrategyOf(ctx, dir, line))
      if (refusal) return [...(fetched.header ? [stdout(fetched.header)] : []), stderr(refusal)]
    }

    try {
      const merged = await mergeInto(ctx, dir, { ref: fetched.ref, label: fetched.oid }, fetched.title)
      return say([fetched.header, merged].filter(Boolean).join('\n'))
    } catch (error) {
      if (!(error instanceof SandboxError) || !fetched.header) throw error
      return [stdout(fetched.header), stderr(error.message)]
    }
  },
}
