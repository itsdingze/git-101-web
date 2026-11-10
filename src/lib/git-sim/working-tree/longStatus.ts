import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { collapseUntrackedFolders } from '@/lib/git-sim/fs/untrackedFolders'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/history/repository'
import { describeUpstreamState } from '@/lib/git-sim/remote/branchTracking'
import { readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { readUnmergedEntries, type UnmergedEntry } from './indexStages'
import { readWorkingTree, type FileChange, type WorkingTree } from './workingTree'
import { readCommitFilesOrEmpty, readIndexFiles } from './treeContents'
import { WHOLE_TREE_VIEW, type StatusView, type UntrackedFilesMode } from './statusView'
import { joinPath, pathFrom } from '@/lib/git-sim/fs/paths'
import type { CommandContext } from '@/lib/git-sim/types'

type CommitPreview = { amending: boolean }

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

function stagedSection(tree: WorkingTree, hasCommits: boolean, merging: boolean, amending: boolean): string[] {
  if (tree.staged.length === 0) return []
  const restoreHint = amending ? '  (use "git restore --source=HEAD^1 --staged <file>..." to unstage)' : '  (use "git restore --staged <file>..." to unstage)'
  const unstageHint = hasCommits ? restoreHint : '  (use "git rm --cached <file>..." to unstage)'
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

function untrackedNotListed(tree: WorkingTree, merging: boolean, unresolved: readonly UnmergedEntry[]): string[] {
  const committable = tree.staged.length > 0 || (merging && unresolved.length === 0)
  return committable ? ['Untracked files not listed (use -u option to show untracked files)'] : []
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

function footer(
  tree: WorkingTree,
  hasCommits: boolean,
  unresolved: readonly UnmergedEntry[],
  merging: boolean,
  untrackedFiles: UntrackedFilesMode,
): string[] {
  if (tree.staged.length > 0) return []
  if (merging && unresolved.length === 0) return []
  if (tree.unstaged.length > 0 || unresolved.length > 0) {
    return ['no changes added to commit (use "git add" and/or "git commit -a")']
  }
  if (tree.untracked.length > 0) {
    return ['nothing added to commit but untracked files present (use "git add" to track)']
  }
  if (!hasCommits) return ['nothing to commit (create/copy files and use "git add" to track)']
  if (untrackedFiles === 'no') return ['nothing to commit (use -u to show untracked files)']
  return ['nothing to commit, working tree clean']
}

async function headerLines(ctx: CommandContext, dir: string, preview: CommitPreview | null, rootAmend: boolean): Promise<string[]> {
  const head = await headOid(ctx, dir)
  const branch = await currentBranch(ctx, dir)

  if (!branch) return [`HEAD detached at ${head ? shortOid(head) : 'unknown'}`]
  if (!head || rootAmend) return [`On branch ${branch}`, '', preview ? 'Initial commit' : 'No commits yet', '']

  const upstreamState = await describeUpstreamState(ctx, dir, branch)
  return upstreamState ? [`On branch ${branch}`, upstreamState, ''] : [`On branch ${branch}`]
}

function seenFrom(ctx: CommandContext, dir: string): (path: string) => string {
  return (path) => pathFrom(ctx.cwd, joinPath(dir, path))
}

function visibleUntracked(paths: readonly string[], tracked: readonly string[], view: StatusView): string[] {
  if (view.untrackedFiles === 'no') return []
  const inScope = paths.filter(view.inScope)
  return view.untrackedFiles === 'all' ? inScope : collapseUntrackedFolders(inScope, tracked, view.collapseBoundary)
}

function treeSeenFrom(
  tree: WorkingTree,
  tracked: readonly string[],
  show: (path: string) => string,
  view: StatusView,
): WorkingTree {
  const visible = (changes: readonly FileChange[]) =>
    changes.filter(({ path }) => view.inScope(path)).map((change) => ({ ...change, path: show(change.path) }))
  return {
    staged: visible(tree.staged),
    unstaged: visible(tree.unstaged),
    untracked: visibleUntracked(tree.untracked, tracked, view).map(show),
  }
}

async function changesSinceParent(ctx: CommandContext, dir: string): Promise<{ staged: FileChange[]; hasParent: boolean }> {
  const head = await headOid(ctx, dir)
  const parent = head ? (await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: head })).commit.parent[0] : undefined
  const base = await readCommitFilesOrEmpty(ctx, dir, parent ?? null)
  const index = await readIndexFiles(ctx, dir)

  const staged = [...new Set([...base.keys(), ...index.keys()])]
    .filter((path) => base.get(path) !== index.get(path))
    .sort()
    .map((path): FileChange => ({ path, kind: !base.has(path) ? 'new' : !index.has(path) ? 'deleted' : 'modified' }))
  return { staged, hasParent: parent !== undefined }
}

export async function formatStatus(
  ctx: CommandContext,
  dir: string,
  view: StatusView = WHOLE_TREE_VIEW,
  preview: CommitPreview | null = null,
): Promise<string> {
  const merging = (await readMergeInProgress(ctx, dir)) !== null
  const full = await readWorkingTree(ctx, dir)
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const show = seenFrom(ctx, dir)
  const unmerged = await readUnmergedEntries(ctx, dir)
  const unresolved = unmerged.filter(({ path }) => view.inScope(path)).map((entry) => ({ ...entry, path: show(entry.path) }))

  const amendBase = preview?.amending ? await changesSinceParent(ctx, dir) : null
  const adjusted = amendBase ? { ...full, staged: amendBase.staged } : full
  const tree = treeSeenFrom(withoutPaths(adjusted, unmerged.map(({ path }) => path)), tracked, show, view)
  const ignored = view.ignoredEntries.filter(view.inScope).map(show)
  const hasCommits = amendBase ? amendBase.hasParent : (await headOid(ctx, dir)) !== null
  const rootAmend = amendBase !== null && !amendBase.hasParent

  return [
    ...(await headerLines(ctx, dir, preview, rootAmend)),
    ...mergeHints(merging, unresolved),
    ...stagedSection(tree, hasCommits, merging, amendBase !== null),
    ...unmergedSection(unresolved, merging),
    ...unstagedSection(tree),
    ...(view.untrackedFiles === 'no' ? untrackedNotListed(tree, merging, unresolved) : untrackedSection(tree)),
    ...ignoredSection(ignored),
    ...footer(tree, hasCommits, unresolved, merging, view.untrackedFiles),
  ].join('\n')
}
