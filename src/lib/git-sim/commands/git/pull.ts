import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, stderr, stdout } from '@/lib/git-sim/output'
import { currentBranch, headOid } from '@/lib/git-sim/history/repository'
import { readUpstream, type Upstream } from '@/lib/git-sim/remote/upstream'
import { fetchFromRemote, resolveRemoteName } from '@/lib/git-sim/remote/fetchFromRemote'
import { refuseMergeWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { mergeInto } from '@/lib/git-sim/merge/mergeInto'
import { divergedRefusal, pullStrategyOf } from '@/lib/git-sim/remote/pullStrategy'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

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
  args: readonly string[],
  current: string,
): Promise<Upstream> {
  const [named, branch] = operandsOf(args)
  if (named && branch) return { remote: named, branch }

  const upstream = await readUpstream(ctx, dir, current)
  if (!upstream) {
    await resolveRemoteName(ctx, dir)
    throw new SandboxError(noTrackingInformation(current, await onlyRemoteName(ctx, dir)))
  }
  if (named && named !== upstream.remote) throw new SandboxError(notTheDefaultRemote(named))
  return upstream
}

export const pull: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const branchName = await currentBranch(ctx, dir)
    if (!branchName) throw new SandboxError("fatal: this course can't pull onto a detached HEAD.")
    await refuseMergeWhileMerging(ctx, dir, 'Pulling')

    const { remote: remoteName, branch } = await pullSource(ctx, dir, args, branchName)

    const result = await fetchFromRemote(ctx, dir, remoteName, branch, operandsOf(args).length > 1)
    if (!result.fetchedOid) throw new SandboxError(`fatal: couldn't find remote ref ${branch}`)

    if (await hasDiverged(ctx, dir, result.fetchedOid)) {
      const refusal = divergedRefusal(await pullStrategyOf(ctx, dir, args))
      if (refusal) return [...(result.header ? [stdout(result.header)] : []), stderr(refusal)]
    }

    try {
      const merged = await mergeInto(
        ctx,
        dir,
        { ref: `refs/remotes/${remoteName}/${branch}`, label: result.fetchedOid },
        `Merge branch '${branch}' of ${result.url}`,
      )
      return say([result.header, merged].filter(Boolean).join('\n'))
    } catch (error) {
      if (!(error instanceof SandboxError) || !result.header) throw error
      return [stdout(result.header), stderr(error.message)]
    }
  },
}
