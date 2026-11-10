import type { ReadCommitResult } from 'isomorphic-git'
import { compareTrees, formatDiffStat } from '@/lib/git-sim/diff/diffStat'
import { combinedDiffLines } from '@/lib/git-sim/diff/combinedDiff'
import { blobHash, formatFileDiff } from '@/lib/git-sim/diff/unifiedDiff'
import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import type { CommandContext } from '@/lib/git-sim/types'

type CommitSides = { before: Map<string, string>; after: Map<string, string> }

async function firstParentSides(ctx: CommandContext, dir: string, entry: ReadCommitResult): Promise<CommitSides> {
  return {
    before: await readCommitFilesOrEmpty(ctx, dir, entry.commit.parent[0] ?? null),
    after: await readCommitFiles(ctx, dir, entry.oid),
  }
}

function allPaths(sides: CommitSides): string[] {
  return [...new Set([...sides.before.keys(), ...sides.after.keys()])].sort()
}

export type PathScope = (path: string) => boolean

function scoped(files: ReadonlyMap<string, string>, inScope: PathScope): Map<string, string> {
  return new Map([...files].filter(([path]) => inScope(path)))
}

async function scopedSides(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<CommitSides> {
  const { before, after } = await firstParentSides(ctx, dir, entry)
  return { before: scoped(before, inScope), after: scoped(after, inScope) }
}

export async function commitStatLines(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<string[]> {
  const { before, after } = await scopedSides(ctx, dir, entry, inScope)
  const stat = formatDiffStat(compareTrees(before, after))
  return stat === '' ? [] : stat.split('\n')
}

export async function commitNameLines(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<string[]> {
  const sides = await scopedSides(ctx, dir, entry, inScope)
  return allPaths(sides).filter((path) => sides.before.get(path) !== sides.after.get(path))
}

export async function commitPatchLines(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<string[]> {
  const sides = await scopedSides(ctx, dir, entry, inScope)
  const diffs: string[] = []
  for (const path of allPaths(sides)) {
    const diff = await formatFileDiff(path, sides.before.get(path), sides.after.get(path))
    if (diff) diffs.push(diff)
  }
  return diffs.flatMap((diff) => diff.split('\n'))
}

async function combinedFileDiff(
  path: string,
  ours: string | undefined,
  theirs: string | undefined,
  result: string,
): Promise<string[]> {
  const hunks = combinedDiffLines(ours ?? '', theirs ?? '', result)
  if (hunks.length === 0) return []
  return [
    `diff --cc ${path}`,
    `index ${await blobHash(ours)},${await blobHash(theirs)}..${await blobHash(result)}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    ...hunks,
  ]
}

export async function mergeCommitNameLines(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<string[]> {
  const [firstParent, secondParent] = entry.commit.parent
  const ours = await readCommitFilesOrEmpty(ctx, dir, firstParent ?? null)
  const theirs = await readCommitFilesOrEmpty(ctx, dir, secondParent ?? null)
  const after = await readCommitFiles(ctx, dir, entry.oid)

  return [...after]
    .filter(([path, result]) => inScope(path) && ours.get(path) !== result && theirs.get(path) !== result)
    .map(([path]) => path)
    .sort()
}

export async function mergeCommitDiffLines(ctx: CommandContext, dir: string, entry: ReadCommitResult, inScope: PathScope): Promise<string[]> {
  const [firstParent, secondParent] = entry.commit.parent
  const ours = await readCommitFilesOrEmpty(ctx, dir, firstParent ?? null)
  const theirs = await readCommitFilesOrEmpty(ctx, dir, secondParent ?? null)
  const after = await readCommitFiles(ctx, dir, entry.oid)

  const lines: string[] = []
  for (const [path, result] of [...after].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!inScope(path) || ours.get(path) === result || theirs.get(path) === result) continue
    lines.push(...(await combinedFileDiff(path, ours.get(path), theirs.get(path), result)))
  }
  return lines
}
