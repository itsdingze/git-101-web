import { say } from '@/lib/git-sim/output'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import { describeTracking, readTracking } from '@/lib/git-sim/branchTracking'
import { readWorkingTree, type FileChange, type WorkingTree } from '@/lib/git-sim/workingTree'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

const LABELS: Record<FileChange['kind'], string> = {
  new: 'new file:',
  modified: 'modified:',
  deleted: 'deleted:',
}

function changeLines(changes: readonly FileChange[]): string[] {
  return changes.map((change) => `\t${LABELS[change.kind].padEnd(12)}${change.path}`)
}

function stagedSection(tree: WorkingTree, hasCommits: boolean): string[] {
  if (tree.staged.length === 0) return []
  const unstageHint = hasCommits
    ? '  (use "git restore --staged <file>..." to unstage)'
    : '  (use "git rm --cached <file>..." to unstage)'
  return ['Changes to be committed:', unstageHint, ...changeLines(tree.staged), '']
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

function footer(tree: WorkingTree): string {
  if (tree.staged.length > 0) return ''
  if (tree.unstaged.length > 0) {
    return 'no changes added to commit (use "git add" and/or "git commit -a")'
  }
  if (tree.untracked.length > 0) {
    return 'nothing added to commit but untracked files present (use "git add" to track)'
  }
  return 'nothing to commit, working tree clean'
}

async function headerLines(ctx: CommandContext, dir: string): Promise<string[]> {
  const head = await headOid(ctx, dir)
  const branch = await currentBranch(ctx, dir)

  if (!branch) return [`HEAD detached at ${head ? shortOid(head) : 'unknown'}`]
  if (!head) return [`On branch ${branch}`, '', 'No commits yet', '']

  const tracking = await readTracking(ctx, dir, branch)
  return tracking ? [`On branch ${branch}`, describeTracking(tracking)] : [`On branch ${branch}`]
}

export async function formatStatus(ctx: CommandContext, dir: string): Promise<string> {
  const tree = await readWorkingTree(ctx, dir)
  const hasCommits = (await headOid(ctx, dir)) !== null

  return [
    ...(await headerLines(ctx, dir)),
    ...stagedSection(tree, hasCommits),
    ...unstagedSection(tree),
    ...untrackedSection(tree),
    footer(tree),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
}

export const status: GitSubcommand = {
  requiresRepo: true,
  run: async (_args, ctx, dir) => say(await formatStatus(ctx, dir)),
}
