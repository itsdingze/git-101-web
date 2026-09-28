import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isDirectory, pathExists, removeTree, writeText } from '@/lib/git-sim/fs/fileOperations'
import { commitSignature, currentBranch, headOid } from '@/lib/git-sim/history/repository'
import { readCommitFiles, readCommitFilesOrEmpty, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { changedPaths, readDirtyWork, restoreDirtyWork, type DirtyWork } from '@/lib/git-sim/working-tree/dirtyWork'
import { writeFilesTree } from '@/lib/git-sim/working-tree/treeWriter'
import { relabelConflictMarkers } from '@/lib/git-sim/merge/conflictLabels'
import { mergeReportLines, NO_CONFLICTS, type MergeConflicts, type MergeTrees } from '@/lib/git-sim/merge/mergeReport'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandContext } from '@/lib/git-sim/types'

export type StashRestore =
  | { kind: 'refused'; message: string }
  | { kind: 'failed'; message: string }
  | { kind: 'applied'; report: string[]; conflicted: boolean; untrackedError: string | null }

type TrackedRestore = { report: string[]; conflicted: boolean }

type Entry = {
  baseOid: string | null
  base: Map<string, string>
  staged: Map<string, string>
  tracked: Map<string, string>
  untracked: Map<string, string>
  added: readonly string[]
}

type ConflictFailure = { code?: string; data?: { bothModified?: unknown; deleteByUs?: unknown; deleteByTheirs?: unknown } }

const UPSTREAM = 'Updated upstream'
const STASHED = 'Stashed changes'
const SIDES = { ours: UPSTREAM, theirs: STASHED }
const OURS_FOLDER = '.git/refs/sim'
const OURS_REF = 'refs/sim/stash-upstream'
const INDEX_CONFLICT = 'error: conflicts in index. Try without --index.'
const INDEX_NOT_UNSTASHED = 'Index was not unstashed.'
const encoder = new TextEncoder()

async function readEntry(ctx: CommandContext, dir: string, oid: string): Promise<Entry> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  const [baseOid, indexOid, untrackedOid] = commit.parent
  const base = await readCommitFilesOrEmpty(ctx, dir, baseOid ?? null)
  const staged = indexOid ? await readCommitFiles(ctx, dir, indexOid) : new Map<string, string>()

  return {
    baseOid: baseOid ?? null,
    base,
    staged,
    tracked: await readCommitFiles(ctx, dir, oid),
    untracked: untrackedOid ? await readCommitFiles(ctx, dir, untrackedOid) : new Map<string, string>(),
    added: [...staged.keys()].filter((path) => !base.has(path)),
  }
}

function overwriteRefusal(paths: readonly string[]): string {
  return [
    'error: Your local changes to the following files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please commit your changes or stash them before you merge.',
    'Aborting',
  ].join('\n')
}

function untrackedOverwriteRefusal(paths: readonly string[]): string {
  return [
    'error: The following untracked working tree files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please move or remove them before you merge.',
    'Aborting',
  ].join('\n')
}

function untrackedRestoreError(paths: readonly string[]): string {
  return [...paths.map((path) => `${path} already exists, no checkout`), 'error: could not restore untracked files from stash'].join(
    '\n',
  )
}

async function writeOrRemove(ctx: CommandContext, dir: string, path: string, contents: string | undefined): Promise<void> {
  const absolute = joinPath(dir, path)
  if (contents !== undefined) await writeText(ctx.fs, absolute, contents)
  else if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
}

async function restageAdditions(ctx: CommandContext, dir: string, entry: Entry): Promise<void> {
  for (const path of entry.added) {
    const absolute = joinPath(dir, path)
    const indexed = entry.staged.get(path)
    if (!(await pathExists(ctx.fs, absolute)) && indexed !== undefined && !entry.tracked.has(path)) {
      await writeText(ctx.fs, absolute, indexed)
    }
    if (await pathExists(ctx.fs, absolute)) await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
}

function pathsIn(list: unknown): string[] {
  return Array.isArray(list) ? list.map(String) : []
}

function conflictsOf(failure: ConflictFailure): MergeConflicts {
  return {
    content: pathsIn(failure.data?.bothModified),
    deletedByUs: pathsIn(failure.data?.deleteByUs),
    deletedByThem: pathsIn(failure.data?.deleteByTheirs),
  }
}

async function stageCleanChanges(
  ctx: CommandContext,
  dir: string,
  entry: Entry,
  conflicts: MergeConflicts,
): Promise<void> {
  const conflicted = new Set([...conflicts.content, ...conflicts.deletedByUs, ...conflicts.deletedByThem])
  for (const path of changedPaths(entry.base, entry.tracked)) {
    if (conflicted.has(path)) continue
    if (entry.tracked.has(path)) {
      await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
      continue
    }
    await writeOrRemove(ctx, dir, path, undefined)
    await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
}

async function standIn(ctx: CommandContext, dir: string, tree: string, parent: string): Promise<string> {
  const author = await commitSignature(ctx, dir)
  return git.writeCommit({
    fs: gitFs(ctx.fs),
    dir,
    commit: { tree, parent: [parent], author, committer: author, message: STASHED },
  })
}

async function upstreamStandIn(
  ctx: CommandContext,
  dir: string,
  indexFiles: ReadonlyMap<string, string>,
  base: string,
): Promise<string> {
  const oid = await standIn(ctx, dir, await writeFilesTree(ctx, dir, indexFiles), base)
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: OURS_REF, value: oid, force: true })
  return oid
}

async function putIndexEntryBack(
  ctx: CommandContext,
  dir: string,
  path: string,
  indexFiles: ReadonlyMap<string, string>,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  const contents = indexFiles.get(path)
  if (contents === undefined) {
    await git.remove({ fs, dir, filepath: path })
    return
  }
  const oid = await git.writeBlob({ fs, dir, blob: encoder.encode(contents) })
  await git.updateIndex({ fs, dir, filepath: path, oid, add: true })
}

async function mergeIntoWorkTree(
  ctx: CommandContext,
  dir: string,
  entry: Entry,
  work: DirtyWork,
  trees: MergeTrees,
): Promise<TrackedRestore> {
  const branch = await currentBranch(ctx, dir)
  const head = await headOid(ctx, dir)
  if (!branch || !head || !entry.baseOid) {
    throw new SandboxError('fatal: cannot apply a stash on a detached HEAD in this course.')
  }

  const theirs = await standIn(ctx, dir, await writeFilesTree(ctx, dir, entry.tracked), entry.baseOid)
  await upstreamStandIn(ctx, dir, trees.ours, entry.baseOid)
  const author = await commitSignature(ctx, dir)

  try {
    const result = await git.merge({
      fs: gitFs(ctx.fs),
      dir,
      ours: OURS_REF,
      theirs,
      author,
      committer: author,
      message: STASHED,
      noUpdateBranch: true,
      fastForward: false,
      abortOnConflict: false,
    })
    const merged = await readCommitFiles(ctx, dir, result.oid ?? theirs)
    for (const path of changedPaths(trees.ours, merged)) {
      await writeOrRemove(ctx, dir, path, merged.get(path))
      await putIndexEntryBack(ctx, dir, path, trees.ours)
    }
    await restageAdditions(ctx, dir, entry)
    return { report: mergeReportLines(trees, NO_CONFLICTS, SIDES), conflicted: false }
  } catch (error) {
    const failure = error as ConflictFailure
    if (failure.code !== 'MergeConflictError') throw error

    const conflicts = conflictsOf(failure)
    await relabelConflictMarkers(ctx, dir, conflicts.content, { ours: OURS_REF, theirs }, SIDES)
    const touched = changedPaths(entry.base, entry.tracked)
    await restoreDirtyWork(ctx, dir, { ...work, entries: work.entries.filter((dirty) => !touched.has(dirty.path)) })
    await stageCleanChanges(ctx, dir, entry, conflicts)
    return { report: mergeReportLines(trees, conflicts, SIDES), conflicted: true }
  } finally {
    await git.deleteRef({ fs: gitFs(ctx.fs), dir, ref: OURS_REF })
    if (await pathExists(ctx.fs, joinPath(dir, OURS_FOLDER))) await removeTree(ctx.fs, joinPath(dir, OURS_FOLDER))
  }
}

async function restoreTracked(ctx: CommandContext, dir: string, entry: Entry, work: DirtyWork): Promise<TrackedRestore> {
  const changed = changedPaths(entry.base, entry.tracked)
  if (changed.size === 0 && entry.added.length === 0) return { report: ['Already up to date.'], conflicted: false }

  const head = await headOid(ctx, dir)
  const nothingStaged = work.entries.every((dirty) => dirty.staged === null)
  if (head === entry.baseOid && nothingStaged) {
    for (const path of changed) await writeOrRemove(ctx, dir, path, entry.tracked.get(path))
    await restageAdditions(ctx, dir, entry)
    return { report: [], conflicted: false }
  }

  const ours = await readIndexFiles(ctx, dir)
  return mergeIntoWorkTree(ctx, dir, entry, work, { base: entry.base, ours, theirs: entry.tracked })
}

function overwrittenPaths(work: DirtyWork, changed: ReadonlySet<string>): string[] {
  return work.entries
    .filter((dirty) => changed.has(dirty.path))
    .filter((dirty) => dirty.workdirContent !== null && dirty.workdirContent !== dirty.indexContent)
    .map((dirty) => dirty.path)
}

async function fileInTheWay(ctx: CommandContext, dir: string, path: string): Promise<string | null> {
  const parts = path.split('/')
  for (let depth = 1; depth < parts.length; depth += 1) {
    const folder = parts.slice(0, depth).join('/')
    const absolute = joinPath(dir, folder)
    if (!(await pathExists(ctx.fs, absolute))) return null
    if (!(await isDirectory(ctx.fs, absolute))) return folder
  }
  return null
}

async function restoreUntracked(ctx: CommandContext, dir: string, entry: Entry): Promise<string | null> {
  for (const path of entry.untracked.keys()) {
    const blocker = await fileInTheWay(ctx, dir, path)
    if (blocker) {
      return [`fatal: cannot create directory at '${blocker}': File exists`, 'error: could not restore untracked files from stash'].join(
        '\n',
      )
    }
  }

  const occupied: string[] = []
  for (const [path, contents] of entry.untracked) {
    const absolute = joinPath(dir, path)
    if (await pathExists(ctx.fs, absolute)) occupied.push(path)
    else await writeText(ctx.fs, absolute, contents)
  }
  return occupied.length > 0 ? untrackedRestoreError(occupied) : null
}

function hunkStart(before: string, after: string): number {
  const old = before.split('\n')
  const changed = after.split('\n').findIndex((line, index) => line !== old[index])
  return Math.max(1, (changed === -1 ? old.length : changed + 1) - 3)
}

async function indexConflicts(ctx: CommandContext, dir: string, entry: Entry): Promise<string | null> {
  const head = await readCommitFilesOrEmpty(ctx, dir, await headOid(ctx, dir))
  const clashing = [...changedPaths(entry.base, entry.staged)].filter((path) => head.get(path) !== entry.base.get(path))
  if (clashing.length === 0) return null

  return [
    ...clashing.flatMap((path) => [
      `error: patch failed: ${path}:${hunkStart(entry.base.get(path) ?? '', entry.staged.get(path) ?? '')}`,
      `error: ${path}: patch does not apply`,
    ]),
    INDEX_CONFLICT,
  ].join('\n')
}

async function restoreIndex(ctx: CommandContext, dir: string, entry: Entry): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const path of changedPaths(entry.base, entry.staged)) {
    const contents = entry.staged.get(path)
    if (contents === undefined) {
      await git.remove({ fs, dir, filepath: path })
      continue
    }
    const oid = await git.writeBlob({ fs, dir, blob: encoder.encode(contents) })
    await git.updateIndex({ fs, dir, filepath: path, oid, add: true })
  }
}

export async function restoreStash(
  ctx: CommandContext,
  dir: string,
  oid: string,
  keepIndex = false,
): Promise<StashRestore> {
  const entry = await readEntry(ctx, dir, oid)
  const changed = changedPaths(entry.base, entry.tracked)
  const work = await readDirtyWork(ctx, dir)

  const indexFailure = keepIndex ? await indexConflicts(ctx, dir, entry) : null
  if (indexFailure) return { kind: 'failed', message: indexFailure }

  const dirty = overwrittenPaths(work, changed)
  const blocking = work.untracked.filter((path) => changed.has(path) && entry.tracked.has(path))
  const refusal = dirty.length > 0 ? overwriteRefusal(dirty) : blocking.length > 0 ? untrackedOverwriteRefusal(blocking) : null
  if (refusal) {
    const untrackedError = await restoreUntracked(ctx, dir, entry)
    return { kind: 'refused', message: untrackedError ? `${refusal}\n${untrackedError}` : refusal }
  }

  const tracked = await restoreTracked(ctx, dir, entry, work)
  if (keepIndex && !tracked.conflicted) await restoreIndex(ctx, dir, entry)
  const report = keepIndex && tracked.conflicted ? [...tracked.report, INDEX_NOT_UNSTASHED] : tracked.report
  return { kind: 'applied', ...tracked, report, untrackedError: await restoreUntracked(ctx, dir, entry) }
}
