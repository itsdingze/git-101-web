import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/headHistory'
import { joinPath } from '@/lib/git-sim/paths'
import { readText, writeText } from '@/lib/git-sim/fileOperations'
import { commitSignature, currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/repository'
import { resolveCommitish } from '@/lib/git-sim/resolveCommitish'
import { commitSubject } from '@/lib/git-sim/commitSubject'
import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/treeContents'
import { compareTrees, formatDiffStat, formatModeChanges } from '@/lib/git-sim/diffStat'
import { beginMerge, endMerge, readMergeInProgress } from '@/lib/git-sim/mergeInProgress'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

type MergeFailure = { code?: string; data?: { filepaths?: unknown } }

type MergeSource = 'merge' | 'pull'

type MergeSides = { ours: string; theirs: string }

const DETACHED_HEAD = 'fatal: cannot merge onto a detached HEAD in this course.'
const NOTHING_TO_ABORT = 'fatal: There is no merge to abort (MERGE_HEAD missing).'

function conflictedPathsOf(error: MergeFailure): string[] {
  return Array.isArray(error.data?.filepaths) ? error.data.filepaths.map(String) : []
}

function conflictOutput(paths: readonly string[], theirs: string): string {
  return [
    ...paths.map((path) => `Auto-merging ${path}`),
    ...paths.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
    ...(paths.length === 0 ? [`Could not merge ${theirs}.`] : []),
    'Automatic merge failed; fix conflicts and then commit the result.',
  ].join('\n')
}

// git.merge labels the ours side with the branch name and takes no override for it.
async function relabelOurSide(
  ctx: CommandContext,
  dir: string,
  ours: string,
  paths: readonly string[],
): Promise<void> {
  for (const path of paths) {
    const absolute = joinPath(dir, path)
    const marked = await readText(ctx.fs, absolute)
    await writeText(ctx.fs, absolute, marked.split(`<<<<<<< ${ours}\n`).join('<<<<<<< HEAD\n'))
  }
}

async function stageIncoming(
  ctx: CommandContext,
  dir: string,
  oids: MergeSides,
  conflicted: readonly string[],
): Promise<void> {
  const [baseOid] = (await git.findMergeBase({
    fs: gitFs(ctx.fs),
    dir,
    oids: [oids.ours, oids.theirs],
  })) as string[]
  const base = await readCommitFilesOrEmpty(ctx, dir, baseOid ?? null)
  const settled = new Set(conflicted)

  for (const [path, contents] of await readCommitFiles(ctx, dir, oids.theirs)) {
    if (settled.has(path) || base.get(path) === contents) continue
    await git.add({ fs: gitFs(ctx.fs), dir, filepath: path, force: true })
  }
}

async function pauseAtConflicts(
  ctx: CommandContext,
  dir: string,
  sides: MergeSides,
  failure: MergeFailure,
): Promise<never> {
  const conflicted = conflictedPathsOf(failure)
  const ourOid = await headOid(ctx, dir)
  const theirOid = (await refOid(ctx, dir, sides.theirs)) ?? sides.theirs

  await relabelOurSide(ctx, dir, sides.ours, conflicted)
  if (ourOid) await stageIncoming(ctx, dir, { ours: ourOid, theirs: theirOid }, conflicted)
  await beginMerge(ctx, dir, { theirs: theirOid, conflicted })

  throw new SandboxError(conflictOutput(conflicted, sides.theirs))
}

async function subjectAt(ctx: CommandContext, dir: string, oid: string): Promise<string> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  return commitSubject(commit.message)
}

export async function mergeInto(
  ctx: CommandContext,
  dir: string,
  theirs: string,
  source: MergeSource,
  message?: string,
): Promise<string> {
  const ours = await currentBranch(ctx, dir)
  if (!ours) throw new SandboxError(DETACHED_HEAD)

  const before = await headOid(ctx, dir)
  const beforeFiles = await readCommitFilesOrEmpty(ctx, dir, before)
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
      message,
      abortOnConflict: false,
    })
  } catch (error) {
    const failure = error as MergeFailure
    if (failure.code === 'MergeConflictError') {
      await pauseAtConflicts(ctx, dir, { ours, theirs }, failure)
    }
    throw error
  }

  if (result.alreadyMerged) return 'Already up to date.'

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: ours, force: true })

  const after = await headOid(ctx, dir)
  const deltas = compareTrees(beforeFiles, await readCommitFilesOrEmpty(ctx, dir, after))
  const summary = [formatDiffStat(deltas), ...formatModeChanges(deltas)].filter(Boolean)

  if (result.fastForward) {
    await recordHeadMove(ctx, dir, `${source === 'pull' ? 'pull' : `merge ${theirs}`}: Fast-forward`)
    return [
      `Updating ${before ? shortOid(before) : ''}..${after ? shortOid(after) : ''}`,
      'Fast-forward',
      ...summary,
    ].join('\n')
  }

  await recordHeadMove(ctx, dir, `commit (merge): ${after ? await subjectAt(ctx, dir, after) : ''}`)
  return [`Merge made by the 'ort' strategy.`, ...summary].join('\n')
}

async function abortMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  if (!(await readMergeInProgress(ctx, dir))) throw new SandboxError(NOTHING_TO_ABORT)

  const ours = await currentBranch(ctx, dir)
  if (!ours) throw new SandboxError(DETACHED_HEAD)

  await git.checkout({ fs: gitFs(ctx.fs), dir, ref: ours, force: true })
  await endMerge(ctx, dir)
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

export const merge: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (hasFlag(args, '--abort')) return abortMerge(ctx, dir)

    const spec = operandsOf(args)[0]
    if (!spec) {
      throw new SandboxError('fatal: No commit specified and merge.defaultToUpstream not set.')
    }

    const theirs = await mergeTarget(ctx, dir, spec)
    if (!theirs) throw new SandboxError(`merge: ${spec} - not something we can merge`)

    return say(await mergeInto(ctx, dir, theirs, 'merge'))
  },
}
