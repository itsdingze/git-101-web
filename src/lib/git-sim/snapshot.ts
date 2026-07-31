import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { currentBranch, findRepoDir, headOid } from './repository'
import { readTracking } from './branchTracking'
import { readWorkingTree, type FileChange } from './workingTree'
import { listEntries } from './fileOperations'
import type { CommandContext } from './types'

export type CommitSummary = {
  oid: string
  message: string
  parents: string[]
  branches: string[]
  files: string[]
}

export type RepoSnapshot = {
  isRepo: boolean
  branch: string | null
  branches: string[]
  commits: CommitSummary[]
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
  workdirFiles: string[]
  tracking: Record<string, { ahead: number; behind: number }>
}

const EMPTY: RepoSnapshot = {
  isRepo: false,
  branch: null,
  branches: [],
  commits: [],
  staged: [],
  unstaged: [],
  untracked: [],
  workdirFiles: [],
  tracking: {},
}

async function collectCommits(
  ctx: CommandContext,
  dir: string,
  branches: readonly string[],
): Promise<CommitSummary[]> {
  const summaries = new Map<string, CommitSummary>()

  for (const name of branches) {
    let entries
    try {
      entries = await git.log({ fs: gitFs(ctx.fs), dir, ref: name, depth: 200 })
    } catch {
      continue
    }

    for (const entry of entries) {
      const existing = summaries.get(entry.oid)
      if (existing) {
        existing.branches.push(name)
        continue
      }
      summaries.set(entry.oid, {
        oid: entry.oid,
        message: entry.commit.message.trim(),
        parents: [...entry.commit.parent],
        branches: [name],
        files: await git.listFiles({ fs: gitFs(ctx.fs), dir, ref: entry.oid }),
      })
    }
  }

  return [...summaries.values()]
}

async function collectTracking(
  ctx: CommandContext,
  dir: string,
  branches: readonly string[],
): Promise<RepoSnapshot['tracking']> {
  const tracking: RepoSnapshot['tracking'] = {}
  for (const name of branches) {
    const summary = await readTracking(ctx, dir, name)
    if (summary) tracking[name] = { ahead: summary.ahead, behind: summary.behind }
  }
  return tracking
}

async function collectWorkdirFiles(ctx: CommandContext, dir: string): Promise<string[]> {
  const entries = await listEntries(ctx.fs, dir)
  return entries.filter((entry) => !entry.name.startsWith('.')).map((entry) => entry.name)
}

export async function readSnapshot(ctx: CommandContext): Promise<RepoSnapshot> {
  const dir = await findRepoDir(ctx)
  if (!dir) return { ...EMPTY, workdirFiles: await collectWorkdirFiles(ctx, ctx.cwd) }

  const branches = await git.listBranches({ fs: gitFs(ctx.fs), dir })
  const tree = await readWorkingTree(ctx, dir)
  const hasCommits = (await headOid(ctx, dir)) !== null

  return {
    isRepo: true,
    branch: await currentBranch(ctx, dir),
    branches,
    commits: hasCommits ? await collectCommits(ctx, dir, branches) : [],
    staged: tree.staged,
    unstaged: tree.unstaged,
    untracked: tree.untracked,
    workdirFiles: await collectWorkdirFiles(ctx, dir),
    tracking: await collectTracking(ctx, dir, branches),
  }
}
