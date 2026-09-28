import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { commitSubject } from './commitSubject'
import { currentBranch, findRepoDir, headOid } from './repository'
import { compareWithRemote } from './branchTracking'
import { readUpstream, remoteRefOf } from './upstream'
import { readMergeInProgress } from './mergeInProgress'
import { readRemoteClones } from './remoteClones'
import { readWorkingTree, type FileChange } from './workingTree'
import { readIgnoredFiles } from './ignoredPaths'
import { listEntries, pathExists, readText } from './fileOperations'
import { joinPath } from './paths'
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
  upstreams: Record<string, string>
  mergeInProgress: boolean
  clones: string[]
  stashes: string[]
  headMessage: string | null
  ignored: string[]
  tracked: string[]
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
  upstreams: {},
  mergeInProgress: false,
  clones: [],
  stashes: [],
  headMessage: null,
  ignored: [],
  tracked: [],
}

const STASH_LOG = '.git/logs/refs/stash'

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

async function publishedRef(
  ctx: CommandContext,
  dir: string,
  branch: string,
): Promise<string | null> {
  const upstream = await readUpstream(ctx, dir, branch)
  if (upstream) return remoteRefOf(upstream)

  const [remote] = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remote ? `${remote.remote}/${branch}` : null
}

async function collectTracking(
  ctx: CommandContext,
  dir: string,
  branches: readonly string[],
): Promise<RepoSnapshot['tracking']> {
  const tracking: RepoSnapshot['tracking'] = {}
  for (const name of branches) {
    const remoteRef = await publishedRef(ctx, dir, name)
    const summary = remoteRef ? await compareWithRemote(ctx, dir, name, remoteRef) : null
    if (summary) tracking[name] = { ahead: summary.ahead, behind: summary.behind }
  }
  return tracking
}

async function collectUpstreams(
  ctx: CommandContext,
  dir: string,
  branches: readonly string[],
): Promise<RepoSnapshot['upstreams']> {
  const upstreams: RepoSnapshot['upstreams'] = {}
  for (const name of branches) {
    const upstream = await readUpstream(ctx, dir, name)
    if (upstream) upstreams[name] = remoteRefOf(upstream)
  }
  return upstreams
}

async function collectWorkdirFiles(ctx: CommandContext, dir: string): Promise<string[]> {
  const entries = await listEntries(ctx.fs, dir)
  return entries.filter((entry) => !entry.name.startsWith('.')).map((entry) => entry.name)
}

async function collectStashes(ctx: CommandContext, dir: string): Promise<string[]> {
  const path = joinPath(dir, STASH_LOG)
  try {
    if (!(await pathExists(ctx.fs, path))) return []
    const lines = (await readText(ctx.fs, path)).split('\n').filter(Boolean)
    return lines.map((line) => line.split('\t')[1] ?? '').reverse()
  } catch {
    return []
  }
}

async function readSubject(ctx: CommandContext, dir: string, oid: string): Promise<string | null> {
  try {
    const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
    return commitSubject(commit.message)
  } catch {
    return null
  }
}

async function collectIgnored(ctx: CommandContext, dir: string): Promise<string[]> {
  try {
    return await readIgnoredFiles(ctx, dir)
  } catch {
    return []
  }
}

async function collectTracked(ctx: CommandContext, dir: string): Promise<string[]> {
  try {
    return await git.listFiles({ fs: gitFs(ctx.fs), dir })
  } catch {
    return []
  }
}

async function readNoRepositorySnapshot(ctx: CommandContext): Promise<RepoSnapshot> {
  return {
    ...EMPTY,
    workdirFiles: await collectWorkdirFiles(ctx, ctx.cwd),
    clones: await readRemoteClones(ctx),
  }
}

async function readRepositorySnapshot(ctx: CommandContext, dir: string): Promise<RepoSnapshot> {
  const branches = await git.listBranches({ fs: gitFs(ctx.fs), dir })
  const tree = await readWorkingTree(ctx, dir)
  const head = await headOid(ctx, dir)

  return {
    isRepo: true,
    branch: await currentBranch(ctx, dir),
    branches,
    commits: head ? await collectCommits(ctx, dir, branches) : [],
    staged: tree.staged,
    unstaged: tree.unstaged,
    untracked: tree.untracked,
    workdirFiles: await collectWorkdirFiles(ctx, dir),
    tracking: await collectTracking(ctx, dir, branches),
    upstreams: await collectUpstreams(ctx, dir, branches),
    mergeInProgress: (await readMergeInProgress(ctx, dir)) !== null,
    clones: await readRemoteClones(ctx),
    stashes: await collectStashes(ctx, dir),
    headMessage: head ? await readSubject(ctx, dir, head) : null,
    ignored: await collectIgnored(ctx, dir),
    tracked: await collectTracked(ctx, dir),
  }
}

export async function readSnapshot(ctx: CommandContext): Promise<RepoSnapshot> {
  const dir = await findRepoDir(ctx)
  if (!dir) return readNoRepositorySnapshot(ctx)

  try {
    return await readRepositorySnapshot(ctx, dir)
  } catch {
    return readNoRepositorySnapshot(ctx)
  }
}
