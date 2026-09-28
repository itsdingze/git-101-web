import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { relabelConflictMarkers } from '@/lib/git-sim/merge/conflictLabels'
import {
  allConflictedPaths,
  mergeReportLines,
  NO_CONFLICTS,
  type MergeConflicts,
  type MergeTrees,
} from '@/lib/git-sim/merge/mergeReport'
import { commitSignature, currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import { compareTrees, formatDiffStat, formatModeChanges } from '@/lib/git-sim/diff/diffStat'
import { beginMerge, endMerge, readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { bestMergeBases, reparentMerge, standInCommit } from '@/lib/git-sim/merge/mergeBase'
import { refuseMergeWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import {
  changedPaths,
  dirtyPathsIn,
  readDirtyWork,
  restoreDirtyWork,
  lostFoldersRefusal,
  stagedPaths,
  untrackedClashesIn,
  type DirtyWork,
} from '@/lib/git-sim/working-tree/dirtyWork'
import { concludeMerge } from './commit'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

type MergeFailure = {
  code?: string
  data?: { bothModified?: unknown; deleteByUs?: unknown; deleteByTheirs?: unknown }
}

type MergeSource = 'merge' | 'pull'

type MergeSides = { ours: string; theirs: string }

type Incoming = { ref: string; label: string }

const DETACHED_HEAD = 'fatal: cannot merge onto a detached HEAD in this course.'
const NOTHING_TO_ABORT = 'fatal: There is no merge to abort (MERGE_HEAD missing).'
const ORT_FAILED = 'Merge with strategy ort failed.'
const MESSAGE_FLAGS = ['-m', '--message']
const EMPTY_TREES: MergeTrees = { base: new Map(), ours: new Map(), theirs: new Map() }

function pathsIn(list: unknown): string[] {
  return Array.isArray(list) ? list.map(String) : []
}

function conflictsOf(error: MergeFailure): MergeConflicts {
  return {
    content: pathsIn(error.data?.bothModified),
    deletedByUs: pathsIn(error.data?.deleteByUs),
    deletedByThem: pathsIn(error.data?.deleteByTheirs),
  }
}

function conflictOutput(trees: MergeTrees, conflicts: MergeConflicts, label: string): string {
  const report = mergeReportLines(trees, conflicts, { ours: 'HEAD', theirs: label })
  return [
    ...(report.length === 0 ? [`Could not merge ${label}.`] : report),
    'Automatic merge failed; fix conflicts and then commit the result.',
  ].join('\n')
}

async function readMergeTrees(ctx: CommandContext, dir: string, ours: string, theirs: string): Promise<MergeTrees> {
  const [baseOid] = await bestMergeBases(ctx, dir, ours, theirs)
  return {
    base: await readCommitFilesOrEmpty(ctx, dir, baseOid ?? null),
    ours: await readCommitFiles(ctx, dir, ours),
    theirs: await readCommitFiles(ctx, dir, theirs),
  }
}

async function stageIncoming(
  ctx: CommandContext,
  dir: string,
  trees: MergeTrees,
  conflicted: ReadonlySet<string>,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const [path, contents] of trees.theirs) {
    if (conflicted.has(path) || trees.base.get(path) === contents) continue
    await git.add({ fs, dir, filepath: path, force: true })
  }

  for (const [path, contents] of trees.base) {
    if (conflicted.has(path) || trees.theirs.has(path) || trees.ours.get(path) !== contents) continue
    await git.remove({ fs, dir, filepath: path })
    const absolute = joinPath(dir, path)
    if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
  }
}

async function pauseAtConflicts(
  ctx: CommandContext,
  dir: string,
  naming: { sides: MergeSides; label: string; theirMarker: string },
  failure: MergeFailure,
  message: string,
): Promise<never> {
  const { sides, label, theirMarker } = naming
  const conflicts = conflictsOf(failure)
  const conflicted = allConflictedPaths(conflicts)
  const ourOid = await headOid(ctx, dir)
  const theirOid = (await refOid(ctx, dir, sides.theirs)) ?? sides.theirs
  const trees = ourOid ? await readMergeTrees(ctx, dir, ourOid, theirOid) : null

  await relabelConflictMarkers(
    ctx,
    dir,
    conflicts.content,
    { ours: sides.ours, theirs: theirMarker },
    { ours: 'HEAD', theirs: label },
  )
  if (trees) await stageIncoming(ctx, dir, trees, new Set(conflicted))
  await beginMerge(ctx, dir, { theirs: theirOid, conflicted, message })

  throw new SandboxError(conflictOutput(trees ?? EMPTY_TREES, conflicts, label))
}

async function subjectAt(ctx: CommandContext, dir: string, oid: string): Promise<string> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  return commitSubject(commit.message)
}

async function isAncestor(
  ctx: CommandContext,
  dir: string,
  ancestor: string,
  oid: string,
): Promise<boolean> {
  if (ancestor === oid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid, ancestor, depth: -1 })
}

async function fastForwardTo(
  ctx: CommandContext,
  dir: string,
  ours: string,
  theirOid: string,
): Promise<{ alreadyMerged: boolean; fastForward: boolean }> {
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: `refs/heads/${ours}`, value: theirOid, force: true })
  return { alreadyMerged: false, fastForward: true }
}

async function directMergeTarget(
  ctx: CommandContext,
  dir: string,
  sides: MergeSides,
): Promise<{ theirs: string; parents: string[] | null }> {
  const ourOid = await headOid(ctx, dir)
  const theirOid = (await refOid(ctx, dir, sides.theirs)) ?? sides.theirs
  if (!ourOid) return { theirs: sides.theirs, parents: null }

  const found = (await git.findMergeBase({ fs: gitFs(ctx.fs), dir, oids: [ourOid, theirOid] })) as string[]
  const best = await bestMergeBases(ctx, dir, ourOid, theirOid)
  if (!best[0] || (found.length <= 1 && best.length <= 1)) return { theirs: sides.theirs, parents: null }

  return { theirs: await standInCommit(ctx, dir, theirOid, best[0]), parents: [ourOid, theirOid] }
}

// isomorphic-git's merge-base walk can return non-minimal bases and then throws MergeNotSupportedError on shapes real git merges.
async function mergeHistories(
  ctx: CommandContext,
  dir: string,
  sides: MergeSides,
  message: string,
  label: string,
): Promise<{ alreadyMerged?: boolean; fastForward?: boolean }> {
  const author = await commitSignature(ctx, dir)
  const target = await directMergeTarget(ctx, dir, sides)
  try {
    const result = await git.merge({
      fs: gitFs(ctx.fs),
      dir,
      ours: sides.ours,
      theirs: target.theirs,
      author,
      committer: author,
      message,
      abortOnConflict: false,
    })
    if (target.parents && result.oid) await reparentMerge(ctx, dir, sides.ours, result.oid, target.parents)
    return result
  } catch (error) {
    const failure = error as MergeFailure
    if (failure.code === 'MergeConflictError') {
      await pauseAtConflicts(ctx, dir, { sides, label, theirMarker: target.theirs }, failure, message)
    }
    throw error
  }
}

function overwriteRefusal(paths: readonly string[]): string[] {
  return [
    'error: Your local changes to the following files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please commit your changes or stash them before you merge.',
    'Aborting',
  ]
}

function untrackedRefusal(paths: readonly string[]): string[] {
  return [
    'error: The following untracked working tree files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please move or remove them before you merge.',
    'Aborting',
  ]
}

function workRefusal(work: DirtyWork, touched: ReadonlySet<string>): string[] | null {
  const dirty = dirtyPathsIn(work, touched)
  if (dirty.length > 0) return overwriteRefusal(dirty)

  const clash = untrackedClashesIn(work, touched)
  if (clash.overwritten.length > 0) return untrackedRefusal(clash.overwritten)
  if (clash.lostFolders.length > 0) return lostFoldersRefusal(clash.lostFolders)
  return null
}

function guardFastForward(work: DirtyWork, touched: ReadonlySet<string>, before: string, after: string): void {
  const refusal = workRefusal(work, touched)
  if (!refusal) return

  throw new SandboxError([`Updating ${shortOid(before)}..${shortOid(after)}`, ...refusal].join('\n'))
}

function guardTrueMerge(work: DirtyWork, touched: ReadonlySet<string>): void {
  const staged = stagedPaths(work)
  if (staged.length > 0) {
    throw new SandboxError(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        ...staged.map((path) => `  ${path}`),
        ORT_FAILED,
      ].join('\n'),
    )
  }

  const refusal = workRefusal(work, touched)
  if (refusal) throw new SandboxError([...refusal, ORT_FAILED].join('\n'))
}

async function incomingChanges(
  ctx: CommandContext,
  dir: string,
  from: string,
  theirOid: string,
): Promise<Set<string>> {
  return changedPaths(await readCommitFilesOrEmpty(ctx, dir, from), await readCommitFiles(ctx, dir, theirOid))
}

function intoSuffix(ours: string): string {
  return ours === 'main' || ours === 'master' ? '' : ` into ${ours}`
}

export async function mergeInto(
  ctx: CommandContext,
  dir: string,
  incoming: Incoming,
  source: MergeSource,
  title: string,
  givenMessage?: string,
): Promise<string> {
  const theirs = incoming.ref
  const ours = await currentBranch(ctx, dir)
  if (!ours) throw new SandboxError(DETACHED_HEAD)

  const before = await headOid(ctx, dir)
  const beforeFiles = await readCommitFilesOrEmpty(ctx, dir, before)
  const theirOid = (await refOid(ctx, dir, theirs)) ?? theirs

  if (before && (await isAncestor(ctx, dir, theirOid, before))) return 'Already up to date.'

  const work = await readDirtyWork(ctx, dir)
  const fastForward = before !== null && (await isAncestor(ctx, dir, before, theirOid))
  if (before && fastForward) {
    guardFastForward(work, await incomingChanges(ctx, dir, before, theirOid), before, theirOid)
  } else if (before) {
    const [base] = await bestMergeBases(ctx, dir, before, theirOid)
    guardTrueMerge(work, await incomingChanges(ctx, dir, base ?? before, theirOid))
  }

  const message = givenMessage ?? `${title}${intoSuffix(ours)}`
  let result: { alreadyMerged?: boolean; fastForward?: boolean }
  try {
    result = fastForward
      ? await fastForwardTo(ctx, dir, ours, theirOid)
      : await mergeHistories(ctx, dir, { ours, theirs }, message, incoming.label)

    if (result.alreadyMerged) return 'Already up to date.'
    await forceCheckout(ctx, dir, ours)
  } finally {
    await restoreDirtyWork(ctx, dir, work)
  }

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
  const autoMerged = before ? mergeReportLines(await readMergeTrees(ctx, dir, before, theirOid), NO_CONFLICTS, { ours: 'HEAD', theirs: incoming.label }) : []
  return [...autoMerged, `Merge made by the 'ort' strategy.`, ...summary].join('\n')
}

async function abortMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const merge = await readMergeInProgress(ctx, dir)
  if (!merge) throw new SandboxError(NOTHING_TO_ABORT)

  const ours = await currentBranch(ctx, dir)
  if (!ours) throw new SandboxError(DETACHED_HEAD)

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
    return say(await mergeInto(ctx, dir, { ref: theirs, label: spec }, 'merge', title, flagValue(args, ...MESSAGE_FLAGS)))
  },
}
