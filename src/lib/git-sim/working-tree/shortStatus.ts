import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { collapseUntrackedFolders } from '@/lib/git-sim/fs/untrackedFolders'
import { readUnmergedEntries, type UnmergedKind } from './indexStages'
import { readWorkingTree, type ChangeKind } from './workingTree'
import { joinPath, pathFrom } from '@/lib/git-sim/fs/paths'
import { currentBranch, headOid } from '@/lib/git-sim/history/repository'
import { compareWithRemote } from '@/lib/git-sim/remote/branchTracking'
import { readUpstream, remoteRefOf } from '@/lib/git-sim/remote/upstream'
import type { StatusView } from './statusView'
import type { CommandContext } from '@/lib/git-sim/types'

export type ShortFormat = {
  rootRelative: boolean
  showBranch: boolean
  separator: '\n' | '\0'
}

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

function countsLabel(ahead: number, behind: number): string {
  const counts = [...(ahead > 0 ? [`ahead ${ahead}`] : []), ...(behind > 0 ? [`behind ${behind}`] : [])]
  return counts.length > 0 ? ` [${counts.join(', ')}]` : ''
}

async function branchHeader(ctx: CommandContext, dir: string): Promise<string> {
  const branch = await currentBranch(ctx, dir)
  if (!branch) return '## HEAD (no branch)'
  if (!(await headOid(ctx, dir))) return `## No commits yet on ${branch}`

  const upstream = await readUpstream(ctx, dir, branch)
  if (!upstream) return `## ${branch}`

  const remoteRef = remoteRefOf(upstream)
  const tracking = await compareWithRemote(ctx, dir, branch, remoteRef)
  if (!tracking) return `## ${branch}...${remoteRef} [gone]`
  return `## ${branch}...${remoteRef}${countsLabel(tracking.ahead, tracking.behind)}`
}

export async function formatShortStatus(
  ctx: CommandContext,
  dir: string,
  view: StatusView,
  format: ShortFormat,
): Promise<string> {
  const show = (path: string) => (format.rootRelative ? path : pathFrom(ctx.cwd, joinPath(dir, path)))
  const tree = await readWorkingTree(ctx, dir)
  const unmerged = (await readUnmergedEntries(ctx, dir)).filter(({ path }) => view.inScope(path))
  const unmergedPaths = new Set(unmerged.map(({ path }) => path))

  const codes = new Map<string, [string, string]>()
  for (const { path, kind } of tree.staged.filter(({ path: p }) => view.inScope(p))) codes.set(path, [STAGED_LETTERS[kind], ' '])
  for (const { path, kind } of tree.unstaged.filter(({ path: p }) => view.inScope(p))) {
    const [staged] = codes.get(path) ?? [' ']
    codes.set(path, [staged, kind === 'deleted' ? 'D' : 'M'])
  }

  const tracked = [
    ...unmerged.map(({ path, kind }) => ({ path, code: UNMERGED_CODES[kind] })),
    ...[...codes].filter(([path]) => !unmergedPaths.has(path)).map(([path, [x, y]]) => ({ path, code: `${x}${y}` })),
  ].sort(byPath)

  const inScopeUntracked = view.untrackedFiles === 'no' ? [] : tree.untracked.filter(view.inScope)
  const listed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const untracked = view.untrackedFiles === 'all' ? inScopeUntracked : collapseUntrackedFolders(inScopeUntracked, listed, view.collapseBoundary)

  const entries = [
    ...(format.showBranch ? [await branchHeader(ctx, dir)] : []),
    ...tracked.map(({ path, code }) => `${code} ${show(path)}`),
    ...untracked.map((path) => `?? ${show(path)}`),
    ...view.ignoredEntries.filter(view.inScope).map((path) => `!! ${show(path)}`),
  ]

  return format.separator === '\0' ? entries.map((entry) => `${entry}\0`).join('') : entries.join('\n')
}
