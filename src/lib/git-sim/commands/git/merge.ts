import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { refOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { endMerge, readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { branchToMergeOnto, refuseMergeWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { mergeInto } from '@/lib/git-sim/merge/mergeInto'
import { readDirtyWork, restoreDirtyWork, type DirtyWork } from '@/lib/git-sim/working-tree/dirtyWork'
import { concludeMerge } from './commit'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const NOTHING_TO_ABORT = 'fatal: There is no merge to abort (MERGE_HEAD missing).'
const MESSAGE_FLAGS = ['-m', '--message']

async function abortMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const merge = await readMergeInProgress(ctx, dir)
  if (!merge) throw new SandboxError(NOTHING_TO_ABORT)

  const ours = await branchToMergeOnto(ctx, dir)

  const work = await readDirtyWork(ctx, dir)
  const conflicted = new Set(merge.conflicted)
  const kept: DirtyWork = {
    entries: work.entries.filter((entry) => entry.staged === null && !conflicted.has(entry.path)),
    untracked: work.untracked,
  }

  await forceCheckout(ctx, dir, ours)
  await endMerge(ctx, dir)
  await restoreDirtyWork(ctx, dir, kept)
  return silent
}

async function mergeTarget(
  ctx: CommandContext,
  dir: string,
  spec: string,
): Promise<string | null> {
  if (await refOid(ctx, dir, spec)) return spec
  return resolveCommitish(ctx, dir, spec)
}

async function mergeTitle(ctx: CommandContext, dir: string, spec: string): Promise<string> {
  if (await refOid(ctx, dir, `refs/heads/${spec}`)) return `Merge branch '${spec}'`
  if (await refOid(ctx, dir, `refs/remotes/${spec}`)) return `Merge remote-tracking branch '${spec}'`
  return `Merge commit '${spec}'`
}

async function continueMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  if (!(await readMergeInProgress(ctx, dir))) {
    throw new SandboxError('fatal: There is no merge in progress (MERGE_HEAD missing).')
  }
  return concludeMerge(ctx, dir)
}

export const merge: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (hasFlag(args, '--abort')) return abortMerge(ctx, dir)
    if (hasFlag(args, '--continue')) return continueMerge(ctx, dir)

    await refuseMergeWhileMerging(ctx, dir, 'Merging')
    const spec = operandsOf(args, MESSAGE_FLAGS)[0]
    if (!spec) {
      throw new SandboxError('fatal: No commit specified and merge.defaultToUpstream not set.')
    }

    const theirs = await mergeTarget(ctx, dir, spec)
    if (!theirs) throw new SandboxError(`merge: ${spec} - not something we can merge`)

    const title = await mergeTitle(ctx, dir, spec)
    const message = flagValue(args, ...MESSAGE_FLAGS)
    const allowFastForward = !hasFlag(args, '--no-ff')
    return say(await mergeInto(ctx, dir, { ref: theirs, label: spec }, title, message, allowFastForward))
  },
}
