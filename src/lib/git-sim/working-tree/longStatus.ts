import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { collapseUntrackedFolders } from '@/lib/git-sim/fs/untrackedFolders'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/history/repository'
import { describeTracking, readTracking } from '@/lib/git-sim/remote/branchTracking'
import { readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { readUnmergedEntries, type UnmergedEntry } from './indexStages'
import { readWorkingTree, type FileChange, type WorkingTree } from './workingTree'
import { joinPath, pathFrom } from '@/lib/git-sim/fs/paths'
import type { CommandContext } from '@/lib/git-sim/types'

const LABELS: Record<FileChange['kind'], string> = {
  new: 'new file:',
  modified: 'modified:',
  deleted: 'deleted:',
}

const PAUSED_HINTS = [
  'You have unmerged paths.',
  '  (fix conflicts and run "git commit")',
  '  (use "git merge --abort" to abort the merge)',
  '',
]

const RESOLVED_HINTS = [
  'All conflicts fixed but you are still merging.',
  '  (use "git commit" to conclude merge)',
  '',
]

const RESOLVE_BY_ADDING = '  (use "git add <file>..." to mark resolution)'
const RESOLVE_BY_ADDING_OR_REMOVING = '  (use "git add/rm <file>..." as appropriate to mark resolution)'

function changeLines(changes: readonly FileChange[]): string[] {
  return changes.map((change) => `\t${LABELS[change.kind].padEnd(12)}${change.path}`)
}

function withoutPaths(tree: WorkingTree, paths: readonly string[]): WorkingTree {
  if (paths.length === 0) return tree
  const hidden = new Set(paths)
  const kept = (changes: readonly FileChange[]) => changes.filter(({ path }) => !hidden.has(path))
  return { staged: kept(tree.staged), unstaged: kept(tree.unstaged), untracked: tree.untracked }
}

function mergeHints(merging: boolean, unresolved: readonly UnmergedEntry[]): string[] {
  if (!merging) return []
  return unresolved.length > 0 ? PAUSED_HINTS : RESOLVED_HINTS
}

function stagedSection(tree: WorkingTree, hasCommits: boolean, merging: boolean): string[] {
  if (tree.staged.length === 0) return []
  const unstageHint = hasCommits
    ? '  (use "git restore --staged <file>..." to unstage)'
    : '  (use "git rm --cached <file>..." to unstage)'
  return ['Changes to be committed:', ...(merging ? [] : [unstageHint]), ...changeLines(tree.staged), '']
}

function unmergedSection(unresolved: readonly UnmergedEntry[], merging: boolean): string[] {
  if (unresolved.length === 0) return []
  const onlyEdits = unresolved.every(({ kind }) => kind === 'both modified' || kind === 'both added')
  return [
    'Unmerged paths:',
    ...(merging ? [] : ['  (use "git restore --staged <file>..." to unstage)']),
    onlyEdits ? RESOLVE_BY_ADDING : RESOLVE_BY_ADDING_OR_REMOVING,
    ...unresolved.map(({ kind, path }) => `\t${`${kind}:`.padEnd(17)}${path}`),
    '',
  ]
}

function unstagedSection(tree: WorkingTree): string[] {
  if (tree.unstaged.length === 0) return []
  const hasDeletion = tree.unstaged.some((change) => change.kind === 'deleted')
  const updateHint = hasDeletion
    ? '  (use "git add/rm <file>..." to update what will be committed)'
    : '  (use "git add <file>..." to update what will be committed)'
  return [
    'Changes not staged for commit:',
    updateHint,
    '  (use "git restore <file>..." to discard changes in working directory)',
    ...changeLines(tree.unstaged),
    '',
  ]
}

function untrackedSection(tree: WorkingTree): string[] {
  if (tree.untracked.length === 0) return []
  return [
    'Untracked files:',
    '  (use "git add <file>..." to include in what will be committed)',
    ...tree.untracked.map((path) => `\t${path}`),
    '',
  ]
}

function ignoredSection(entries: readonly string[]): string[] {
  if (entries.length === 0) return []
  return [
    'Ignored files:',
    '  (use "git add -f <file>..." to include in what will be committed)',
    ...entries.map((entry) => `\t${entry}`),
    '',
  ]
}

function footer(tree: WorkingTree, hasCommits: boolean, unresolved: readonly UnmergedEntry[], merging: boolean): string[] {
  if (tree.staged.length > 0) return []
  if (merging && unresolved.length === 0) return []
  if (tree.unstaged.length > 0 || unresolved.length > 0) {
    return ['no changes added to commit (use "git add" and/or "git commit -a")']
  }
  if (tree.untracked.length > 0) {
    return ['nothing added to commit but untracked files present (use "git add" to track)']
  }
  if (!hasCommits) return ['nothing to commit (create/copy files and use "git add" to track)']
  return ['nothing to commit, working tree clean']
}

async function headerLines(ctx: CommandContext, dir: string): Promise<string[]> {
  const head = await headOid(ctx, dir)
  const branch = await currentBranch(ctx, dir)

  if (!branch) return [`HEAD detached at ${head ? shortOid(head) : 'unknown'}`]
  if (!head) return [`On branch ${branch}`, '', 'No commits yet', '']

  const tracking = await readTracking(ctx, dir, branch)
  return tracking ? [`On branch ${branch}`, describeTracking(tracking), ''] : [`On branch ${branch}`]
}

function seenFrom(ctx: CommandContext, dir: string): (path: string) => string {
  return (path) => pathFrom(ctx.cwd, joinPath(dir, path))
}

function treeSeenFrom(
  tree: WorkingTree,
  tracked: readonly string[],
  show: (path: string) => string,
): WorkingTree {
  const shown = (changes: readonly FileChange[]) => changes.map((change) => ({ ...change, path: show(change.path) }))
  return {
    staged: shown(tree.staged),
    unstaged: shown(tree.unstaged),
    untracked: collapseUntrackedFolders(tree.untracked, tracked).map(show),
  }
}

export async function formatStatus(
  ctx: CommandContext,
  dir: string,
  ignoredEntries: readonly string[] = [],
): Promise<string> {
  const merging = (await readMergeInProgress(ctx, dir)) !== null
  const full = await readWorkingTree(ctx, dir)
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const show = seenFrom(ctx, dir)
  const unmerged = await readUnmergedEntries(ctx, dir)
  const unresolved = unmerged.map((entry) => ({ ...entry, path: show(entry.path) }))
  const tree = treeSeenFrom(withoutPaths(full, unmerged.map(({ path }) => path)), tracked, show)
  const ignored = ignoredEntries.map(show)
  const hasCommits = (await headOid(ctx, dir)) !== null

  return [
    ...(await headerLines(ctx, dir)),
    ...mergeHints(merging, unresolved),
    ...stagedSection(tree, hasCommits, merging),
    ...unmergedSection(unresolved, merging),
    ...unstagedSection(tree),
    ...untrackedSection(tree),
    ...ignoredSection(ignored),
    ...footer(tree, hasCommits, unresolved, merging),
  ].join('\n')
}
