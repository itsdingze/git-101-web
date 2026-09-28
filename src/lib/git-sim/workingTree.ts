import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { isIgnoredPath } from './ignoredPaths'
import type { CommandContext } from './types'

export type ChangeKind = 'new' | 'modified' | 'deleted'

export type FileChange = {
  path: string
  kind: ChangeKind
}

export type WorkingTree = {
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
}

type StatusRow = [string, number, number, number]

export async function readStatusRows(
  ctx: CommandContext,
  dir: string,
): Promise<StatusRow[]> {
  return (await git.statusMatrix({ fs: gitFs(ctx.fs), dir })) as StatusRow[]
}

function stagedChange(head: number, stage: number): ChangeKind | null {
  if (head === 0 && stage > 0) return 'new'
  if (head === 1 && stage === 0) return 'deleted'
  if (head === 1 && stage >= 2) return 'modified'
  return null
}

function unstagedChange(workdir: number, stage: number): ChangeKind | null {
  if (workdir === 0 && stage > 0) return 'deleted'
  if (workdir === 2 && stage === 1) return 'modified'
  if (workdir === 2 && stage === 3) return 'modified'
  return null
}

function isUntracked(workdir: number, stage: number): boolean {
  return stage === 0 && workdir > 0
}

export function classifyRows(rows: readonly StatusRow[]): WorkingTree {
  const tree: WorkingTree = { staged: [], unstaged: [], untracked: [] }

  for (const [path, head, workdir, stage] of rows) {
    const staged = stagedChange(head, stage)
    if (staged) tree.staged.push({ path, kind: staged })

    if (isUntracked(workdir, stage)) {
      tree.untracked.push(path)
      continue
    }

    const unstaged = unstagedChange(workdir, stage)
    if (unstaged) tree.unstaged.push({ path, kind: unstaged })
  }

  return tree
}

async function withoutIgnored(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<string[]> {
  const visible: string[] = []
  for (const path of paths) {
    if (!(await isIgnoredPath(ctx, dir, path))) visible.push(path)
  }
  return visible
}

export async function readWorkingTree(
  ctx: CommandContext,
  dir: string,
): Promise<WorkingTree> {
  const tree = classifyRows(await readStatusRows(ctx, dir))
  return { ...tree, untracked: await withoutIgnored(ctx, dir, tree.untracked) }
}

export function isClean(tree: WorkingTree): boolean {
  return tree.staged.length === 0 && tree.unstaged.length === 0 && tree.untracked.length === 0
}
