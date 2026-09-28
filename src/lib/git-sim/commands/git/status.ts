import { say } from '@/lib/git-sim/output'
import { hasFlag } from '@/lib/git-sim/parseArgs'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import { describeTracking, readTracking } from '@/lib/git-sim/branchTracking'
import { readIgnoredEntries } from '@/lib/git-sim/ignoredPaths'
import { readMergeInProgress, type MergeInProgress } from '@/lib/git-sim/mergeInProgress'
import { readWorkingTree, type FileChange, type WorkingTree } from '@/lib/git-sim/workingTree'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

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

function changeLines(changes: readonly FileChange[]): string[] {
  return changes.map((change) => `\t${LABELS[change.kind].padEnd(12)}${change.path}`)
}

function unresolvedPaths(merge: MergeInProgress | null, tree: WorkingTree): string[] {
  if (!merge) return []
  const edited = new Set(tree.unstaged.map((change) => change.path))
  return merge.conflicted.filter((path) => edited.has(path))
}

function withoutPaths(tree: WorkingTree, paths: readonly string[]): WorkingTree {
  if (paths.length === 0) return tree
  const hidden = new Set(paths)
  const kept = (changes: readonly FileChange[]) => changes.filter(({ path }) => !hidden.has(path))
  return { staged: kept(tree.staged), unstaged: kept(tree.unstaged), untracked: tree.untracked }
}

function mergeHints(merging: boolean, unresolved: readonly string[]): string[] {
  if (!merging) return []
  return unresolved.length > 0 ? PAUSED_HINTS : RESOLVED_HINTS
}

function stagedSection(tree: WorkingTree, hasCommits: boolean): string[] {
  if (tree.staged.length === 0) return []
  const unstageHint = hasCommits
    ? '  (use "git restore --staged <file>..." to unstage)'
    : '  (use "git rm --cached <file>..." to unstage)'
  return ['Changes to be committed:', unstageHint, ...changeLines(tree.staged), '']
}

function unmergedSection(unresolved: readonly string[]): string[] {
  if (unresolved.length === 0) return []
  return [
    'Unmerged paths:',
    '  (use "git add <file>..." to mark resolution)',
    ...unresolved.map((path) => `\tboth modified:   ${path}`),
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

function footer(tree: WorkingTree, hasCommits: boolean, unresolved: readonly string[]): string[] {
  if (tree.staged.length > 0) return []
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
  return tracking ? [`On branch ${branch}`, describeTracking(tracking)] : [`On branch ${branch}`]
}

export async function formatStatus(
  ctx: CommandContext,
  dir: string,
  ignored: readonly string[] = [],
): Promise<string> {
  const merge = await readMergeInProgress(ctx, dir)
  const full = await readWorkingTree(ctx, dir)
  const unresolved = unresolvedPaths(merge, full)
  const tree = withoutPaths(full, unresolved)
  const hasCommits = (await headOid(ctx, dir)) !== null

  return [
    ...(await headerLines(ctx, dir)),
    ...mergeHints(merge !== null, unresolved),
    ...stagedSection(tree, hasCommits),
    ...unmergedSection(unresolved),
    ...unstagedSection(tree),
    ...untrackedSection(tree),
    ...ignoredSection(ignored),
    ...footer(tree, hasCommits, unresolved),
  ].join('\n')
}

export const status: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const ignored = hasFlag(args, '--ignored') ? await readIgnoredEntries(ctx, dir) : []
    return say(await formatStatus(ctx, dir, ignored))
  },
}
