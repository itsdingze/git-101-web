import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { commitSignature, currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/repository'
import { readCommitFiles } from '@/lib/git-sim/treeContents'
import { compareTrees, formatDiffStat, formatModeChanges } from '@/lib/git-sim/diffStat'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type MergeFailure = { code?: string; data?: { filepaths?: unknown } }

function conflictOutput(error: MergeFailure, theirs: string): string {
  const filepaths = Array.isArray(error.data?.filepaths) ? error.data.filepaths.map(String) : []
  return [
    ...filepaths.map((path) => `Auto-merging ${path}`),
    ...filepaths.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
    ...(filepaths.length === 0 ? [`Could not merge ${theirs}.`] : []),
    'Automatic merge failed; fix conflicts and then commit the result.',
  ].join('\n')
}

async function treeAt(
  ctx: CommandContext,
  dir: string,
  oid: string | null,
): Promise<Map<string, string>> {
  return oid ? readCommitFiles(ctx, dir, oid) : new Map<string, string>()
}

export async function mergeInto(
  ctx: CommandContext,
  dir: string,
  theirs: string,
): Promise<string> {
  const ours = await currentBranch(ctx, dir)
  if (!ours) throw new SandboxError('fatal: cannot merge onto a detached HEAD in this course.')

  const before = await headOid(ctx, dir)
  const beforeFiles = await treeAt(ctx, dir, before)
  const author = await commitSignature(ctx, dir)

  let result
  try {
    result = await git.merge({
      fs: gitFs(ctx.fs),
      dir,
      ours,
      theirs,
      author,
      committer: author,
      abortOnConflict: false,
    })
  } catch (error) {
    const failure = error as MergeFailure
    if (failure.code === 'MergeConflictError') throw new SandboxError(conflictOutput(failure, theirs))
    throw error
  }

  if (result.alreadyMerged) return 'Already up to date.'

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: ours, force: true })

  const after = await headOid(ctx, dir)
  const deltas = compareTrees(beforeFiles, await treeAt(ctx, dir, after))
  const summary = [formatDiffStat(deltas), ...formatModeChanges(deltas)].filter(Boolean)

  if (result.fastForward) {
    return [
      `Updating ${before ? shortOid(before) : ''}..${after ? shortOid(after) : ''}`,
      'Fast-forward',
      ...summary,
    ].join('\n')
  }

  return [`Merge made by the 'ort' strategy.`, ...summary].join('\n')
}

export const merge: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const theirs = operandsOf(args)[0]
    if (!theirs) {
      throw new SandboxError('fatal: No commit specified and merge.defaultToUpstream not set.')
    }
    if (!(await refOid(ctx, dir, theirs))) {
      throw new SandboxError(`merge: ${theirs} - not something we can merge`)
    }

    return say(await mergeInto(ctx, dir, theirs))
  },
}
