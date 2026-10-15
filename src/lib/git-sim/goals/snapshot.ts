import git from 'isomorphic-git'
import { globalScope, projectScope, type ConfigScope } from '@/lib/git-sim/config/configScope'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { currentBranch, findRepoDir, hasRepositoryAbove, headOid } from '@/lib/git-sim/history/repository'
import { compareWithRemote } from '@/lib/git-sim/remote/branchTracking'
import { readUpstream, remoteRefOf } from '@/lib/git-sim/remote/upstream'
import { readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { readRemoteClones } from '@/lib/git-sim/remote/remoteClones'
import { readWorkingTree, type FileChange } from '@/lib/git-sim/working-tree/workingTree'
import { filesBelow, repositoriesBelow } from '@/lib/git-sim/fs/folderContents'
import { listEntries, pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath, pathFrom } from '@/lib/git-sim/fs/paths'
import { filesWithMarkers, headHasMarkers } from '@/lib/git-sim/merge/conflictMarkers'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import type { PullRequestState } from '@/lib/git-sim/github/githubState'
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
  fileLines: Record<string, string[]>
  nestedRepositories: string[]
  tracking: Record<string, { ahead: number; behind: number }>
  upstreams: Record<string, string>
  mergeInProgress: boolean
  mergeConflictFiles: string[]
  clones: string[]
  stashes: string[]
  headMessage: string | null
  tracked: string[]
  config: Record<string, string>
  cutShortConfig: string[]
  multiValuedConfig: string[]
  repoLocation: 'project' | 'above' | null
  repoAboveProject: boolean
  conflictMarkerFiles: string[]
  unmerged: string[]
  markersCommitted: boolean
  lastCommand: string | null
  lastCommandFailed: boolean
  lastCommandNamedCommit: string | null
  currentFolder: string
  githubAccount: string | null
  pullRequests: PullRequestSummary[]
}

type PullRequestSummary = {
  branch: string
  state: PullRequestState
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
  fileLines: {},
  nestedRepositories: [],
  tracking: {},
  upstreams: {},
  mergeInProgress: false,
  mergeConflictFiles: [],
  clones: [],
  stashes: [],
  headMessage: null,
  tracked: [],
  config: {},
  cutShortConfig: [],
  multiValuedConfig: [],
  repoLocation: null,
  repoAboveProject: false,
  conflictMarkerFiles: [],
  unmerged: [],
  markersCommitted: false,
  lastCommand: null,
  lastCommandFailed: false,
  lastCommandNamedCommit: null,
  currentFolder: '',
  githubAccount: null,
  pullRequests: [],
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

async function collectFileLines(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<Record<string, string[]>> {
  const lines: Record<string, string[]> = {}
  for (const path of paths) {
    const text = await readText(ctx.fs, joinPath(dir, path))
    lines[path] = text.split('\n').filter((line) => line !== '')
  }
  return lines
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

async function collectTracked(ctx: CommandContext, dir: string): Promise<string[]> {
  try {
    return await git.listFiles({ fs: gitFs(ctx.fs), dir })
  } catch {
    return []
  }
}

function homeRelativeFolder(ctx: CommandContext): string {
  const folder = pathFrom(ctx.root, ctx.cwd)
  return folder === './' ? '' : folder
}

function sessionState(ctx: CommandContext): Pick<RepoSnapshot, 'currentFolder' | 'githubAccount' | 'pullRequests'> {
  return {
    currentFolder: homeRelativeFolder(ctx),
    githubAccount: ctx.github.account,
    pullRequests: ctx.github.pullRequests.map((pull) => ({ branch: pull.head, state: pull.state })),
  }
}

function globalConfigOf(ctx: CommandContext): Record<string, string> {
  return Object.fromEntries(ctx.globalConfig.filter((entry) => entry.value !== '').map((entry) => [entry.key, entry.value]))
}

async function multiValuedKeys(scope: ConfigScope): Promise<string[]> {
  const keys: string[] = []
  for (const key of PROJECT_CONFIG_KEYS) {
    if ((await scope.values(key)).length > 1) keys.push(key)
  }
  return keys
}

async function collectMultiValued(ctx: CommandContext, dir: string | null): Promise<string[]> {
  const global = await multiValuedKeys(globalScope(ctx.globalConfig))
  const project = dir ? await multiValuedKeys(projectScope(ctx.fs, dir)) : []
  return [...new Set([...global, ...project])]
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
  const workdirPaths = await filesBelow(ctx, projectDir)

  return {
    ...EMPTY,
    workdirFiles: await collectWorkdirFiles(ctx, projectDir),
    workdirPaths,
    fileLines: await collectFileLines(ctx, projectDir, workdirPaths),
    nestedRepositories: await repositoriesBelow(ctx, projectDir),
    clones: await readRemoteClones(ctx),
    config: globalConfigOf(ctx),
    cutShortConfig: [...ctx.cutShortConfig],
    multiValuedConfig: await collectMultiValued(ctx, null),
    ...sessionState(ctx),
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
  const workdirPaths = await filesBelow(ctx, projectDir)
  const merge = await readMergeInProgress(ctx, dir)

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
    fileLines: await collectFileLines(ctx, projectDir, workdirPaths),
    nestedRepositories: await repositoriesBelow(ctx, projectDir),
    tracking: await collectTracking(ctx, dir, branches),
    upstreams: await collectUpstreams(ctx, dir, branches),
    mergeInProgress: merge !== null,
    mergeConflictFiles: (merge?.conflicted ?? []).map((path) => pathFrom(projectDir, joinPath(dir, path))),
    clones: await readRemoteClones(ctx),
    stashes: await collectStashes(ctx, dir),
    headMessage: head ? await readSubject(ctx, dir, head) : null,
    tracked: await collectTracked(ctx, dir),
    config: await collectConfig(ctx, dir),
    cutShortConfig: [...ctx.cutShortConfig],
    multiValuedConfig: await collectMultiValued(ctx, dir),
    repoLocation: dir === projectDir ? 'project' : 'above',
    repoAboveProject: await hasRepositoryAbove(ctx, projectDir),
    conflictMarkerFiles: await filesWithMarkers(ctx, projectDir, workdirPaths),
    unmerged: (await readUnmergedEntries(ctx, dir)).map((entry) => entry.path),
    markersCommitted: head ? await headHasMarkers(ctx, dir, head) : false,
    lastCommand: null,
    lastCommandFailed: false,
    lastCommandNamedCommit: null,
    ...sessionState(ctx),
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
