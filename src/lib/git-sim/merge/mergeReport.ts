export type MergeTrees = {
  base: ReadonlyMap<string, string>
  ours: ReadonlyMap<string, string>
  theirs: ReadonlyMap<string, string>
}

export type MergeConflicts = {
  content: readonly string[]
  deletedByUs: readonly string[]
  deletedByThem: readonly string[]
}

export const NO_CONFLICTS: MergeConflicts = { content: [], deletedByUs: [], deletedByThem: [] }

function byPath(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function autoMergedPaths(trees: MergeTrees): string[] {
  return [...trees.ours.keys()].filter((path) => {
    const ours = trees.ours.get(path)
    const theirs = trees.theirs.get(path)
    const base = trees.base.get(path)
    return theirs !== undefined && ours !== theirs && ours !== base && theirs !== base
  })
}

export function allConflictedPaths(conflicts: MergeConflicts): string[] {
  return [...conflicts.content, ...conflicts.deletedByUs, ...conflicts.deletedByThem]
}

type SideLabels = { ours: string; theirs: string }

function linesFor(path: string, trees: MergeTrees, conflicts: MergeConflicts, labels: SideLabels): string[] {
  const { ours, theirs } = labels
  if (conflicts.deletedByThem.includes(path)) {
    return [`CONFLICT (modify/delete): ${path} deleted in ${theirs} and modified in ${ours}.  Version ${ours} of ${path} left in tree.`]
  }
  if (conflicts.deletedByUs.includes(path)) {
    return [`CONFLICT (modify/delete): ${path} deleted in ${ours} and modified in ${theirs}.  Version ${theirs} of ${path} left in tree.`]
  }
  if (!conflicts.content.includes(path)) return [`Auto-merging ${path}`]

  const kind = trees.base.has(path) ? 'content' : 'add/add'
  return [`Auto-merging ${path}`, `CONFLICT (${kind}): Merge conflict in ${path}`]
}

export function mergeReportLines(trees: MergeTrees, conflicts: MergeConflicts, labels: SideLabels): string[] {
  const paths = [...new Set([...autoMergedPaths(trees), ...allConflictedPaths(conflicts)])].sort(byPath)
  return paths.flatMap((path) => linesFor(path, trees, conflicts, labels))
}
