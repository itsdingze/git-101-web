import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { currentBranch, findRepoDir, headOid } from '@/lib/git-sim/history/repository'
import { compareWithRemote } from '@/lib/git-sim/remote/branchTracking'
import { readUpstream, remoteRefOf } from '@/lib/git-sim/remote/upstream'
import { readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { readRemoteClones } from '@/lib/git-sim/remote/remoteClones'
import { readWorkingTree, type FileChange } from '@/lib/git-sim/working-tree/workingTree'
import { readIgnoredFiles } from '@/lib/git-sim/fs/ignoredPaths'
import { listEntries, pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { filesWithMarkers, headHasMarkers } from '@/lib/git-sim/merge/conflictMarkers'
import type { CommandContext } from '@/lib/git-sim/types'

export type CommitSummary = {
  oid: string
  modified: string[]
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
  workdirPaths: string[]
  lineCounts: Record<string, number>
  tracking: Record<string, { ahead: number; behind: number }>
  upstreams: Record<string, string>
  mergeInProgress: boolean
  clones: string[]
  stashes: string[]
  headMessage: string | null
  ignored: string[]
  tracked: string[]
  config: Record<string, string>
  repoLocation: 'project' | 'above' | null
  conflictMarkerFiles: string[]
  markersCommitted: boolean
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
  workdirPaths: [],
  lineCounts: {},
  tracking: {},
  upstreams: {},
  mergeInProgress: false,
  clones: [],
  stashes: [],
  headMessage: null,
  ignored: [],
  tracked: [],
  config: {},
  repoLocation: null,
  conflictMarkerFiles: [],
  markersCommitted: false,
}

const PROJECT_CONFIG_KEYS = ['user.name', 'user.email', 'core.editor', 'pull.rebase']

const STASH_LOG = '.git/logs/refs/stash'

async function modifiedSinceParent(
  ctx: CommandContext,
  dir: string,
  oid: string,
  parent: string | undefined,
): Promise<string[]> {
  if (!parent) return []

  const changed: unknown = await git.walk({
    fs: gitFs(ctx.fs),
    dir,
    trees: [git.TREE({ ref: parent }), git.TREE({ ref: oid })],
    map: async (path, [before, after]) => {
      if (!before || !after || (await after.type()) !== 'blob') return undefined
      return (await before.oid()) === (await after.oid()) ? undefined : path
    },
  })
  return Array.isArray(changed) ? changed.filter((path): path is string => typeof path === 'string') : []
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
        modified: await modifiedSinceParent(ctx, dir, entry.oid, entry.commit.parent[0]),
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

async function collectWorkdirPaths(ctx: CommandContext, dir: string, prefix = ''): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await listEntries(ctx.fs, dir)) {
    if (entry.name === '.git') continue
    const path = `${prefix}${entry.name}`
    if (entry.directory) paths.push(...(await collectWorkdirPaths(ctx, joinPath(dir, entry.name), `${path}/`)))
    else paths.push(path)
  }
  return paths
}

async function collectLineCounts(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const path of paths) {
    const text = await readText(ctx.fs, joinPath(dir, path))
    counts[path] = text.split('\n').filter((line) => line !== '').length
  }
  return counts
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

function globalConfigOf(ctx: CommandContext): Record<string, string> {
  return Object.fromEntries([...ctx.globalConfig].filter(([, value]) => value !== ''))
}

async function collectConfig(ctx: CommandContext, dir: string): Promise<Record<string, string>> {
  const config = globalConfigOf(ctx)
  for (const path of PROJECT_CONFIG_KEYS) {
    const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path })
    if (typeof value === 'string' && value !== '') config[path] = value
  }
  return config
}

async function readNoRepositorySnapshot(ctx: CommandContext, projectDir: string): Promise<RepoSnapshot> {
  const workdirPaths = await collectWorkdirPaths(ctx, projectDir)

  return {
    ...EMPTY,
    workdirFiles: await collectWorkdirFiles(ctx, projectDir),
    workdirPaths,
    lineCounts: await collectLineCounts(ctx, projectDir, workdirPaths),
    clones: await readRemoteClones(ctx),
    config: globalConfigOf(ctx),
  }
}

async function readRepositorySnapshot(
  ctx: CommandContext,
  dir: string,
  projectDir: string,
): Promise<RepoSnapshot> {
  const branches = await git.listBranches({ fs: gitFs(ctx.fs), dir })
  const tree = await readWorkingTree(ctx, dir)
  const head = await headOid(ctx, dir)
  const workdirPaths = await collectWorkdirPaths(ctx, projectDir)

  return {
    isRepo: true,
    branch: await currentBranch(ctx, dir),
    branches,
    commits: head ? await collectCommits(ctx, dir, branches) : [],
    staged: tree.staged,
    unstaged: tree.unstaged,
    untracked: tree.untracked,
    workdirFiles: await collectWorkdirFiles(ctx, projectDir),
    workdirPaths,
    lineCounts: await collectLineCounts(ctx, projectDir, workdirPaths),
    tracking: await collectTracking(ctx, dir, branches),
    upstreams: await collectUpstreams(ctx, dir, branches),
    mergeInProgress: (await readMergeInProgress(ctx, dir)) !== null,
    clones: await readRemoteClones(ctx),
    stashes: await collectStashes(ctx, dir),
    headMessage: head ? await readSubject(ctx, dir, head) : null,
    ignored: await collectIgnored(ctx, dir),
    tracked: await collectTracked(ctx, dir),
    config: await collectConfig(ctx, dir),
    repoLocation: dir === projectDir ? 'project' : 'above',
    conflictMarkerFiles: await filesWithMarkers(ctx, projectDir, workdirPaths),
    markersCommitted: head ? await headHasMarkers(ctx, dir, head) : false,
  }
}

export async function readSnapshot(ctx: CommandContext, projectDir: string): Promise<RepoSnapshot> {
  const dir = await findRepoDir(ctx, projectDir)
  if (!dir) return readNoRepositorySnapshot(ctx, projectDir)

  try {
    return await readRepositorySnapshot(ctx, dir, projectDir)
  } catch {
    return readNoRepositorySnapshot(ctx, projectDir)
  }
}
