import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { collapseUntrackedFolders } from '@/lib/git-sim/fs/untrackedFolders'
import { readUnmergedEntries, type UnmergedKind } from './indexStages'
import { readWorkingTree, type ChangeKind } from './workingTree'
import { joinPath, pathFrom } from '@/lib/git-sim/fs/paths'
import type { CommandContext } from '@/lib/git-sim/types'

const UNMERGED_CODES: Record<UnmergedKind, string> = {
  'both modified': 'UU',
  'both added': 'AA',
  'deleted by them': 'UD',
  'deleted by us': 'DU',
  'added by us': 'AU',
  'added by them': 'UA',
}

const STAGED_LETTERS: Record<ChangeKind, string> = { new: 'A', modified: 'M', deleted: 'D' }

function byPath(a: { path: string }, b: { path: string }): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

export async function formatShortStatus(
  ctx: CommandContext,
  dir: string,
  ignoredEntries: readonly string[],
): Promise<string> {
  const show = (path: string) => pathFrom(ctx.cwd, joinPath(dir, path))
  const tree = await readWorkingTree(ctx, dir)
  const unmerged = await readUnmergedEntries(ctx, dir)
  const unmergedPaths = new Set(unmerged.map(({ path }) => path))

  const codes = new Map<string, [string, string]>()
  for (const { path, kind } of tree.staged) codes.set(path, [STAGED_LETTERS[kind], ' '])
  for (const { path, kind } of tree.unstaged) {
    const [staged] = codes.get(path) ?? [' ']
    codes.set(path, [staged, kind === 'deleted' ? 'D' : 'M'])
  }

  const tracked = [
    ...unmerged.map(({ path, kind }) => ({ path, code: UNMERGED_CODES[kind] })),
    ...[...codes].filter(([path]) => !unmergedPaths.has(path)).map(([path, [x, y]]) => ({ path, code: `${x}${y}` })),
  ].sort(byPath)
  const listed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const untracked = collapseUntrackedFolders(tree.untracked, listed)

  return [
    ...tracked.map(({ path, code }) => `${code} ${show(path)}`),
    ...untracked.map((path) => `?? ${show(path)}`),
    ...ignoredEntries.map((path) => `!! ${show(path)}`),
  ].join('\n')
}
