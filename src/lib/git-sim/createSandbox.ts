import { setOnlyValue } from './config/configScope'
import { createSandboxFs } from './fs/sandboxFs'
import { makeDirectory, readText, removeTree, writeText } from './fs/fileOperations'
import { displayPath, joinPath, resolvePath } from './fs/paths'
import { currentBranch, findRepoDir } from './history/repository'
import { cloneInto, createRemoteRepo } from './remote/remoteTransfer'
import { runCommand, type RunResult } from './runCommand'
import { NO_LOCKS, type CommandLocks } from './input/commandLocks'
import type { ShellAccess } from './input/shellAccess'
import { completeLine, type Completion } from './input/completion'
import { readSnapshot, type RepoSnapshot } from './goals/snapshot'
import { namedCommitMessage } from './history/namedCommit'
import { readFolderContents, type FolderContents } from './fs/folderContents'
import { createGitHubState, type GitHubSeed } from './github/githubState'
import { hasNewWorkOnGitHub } from './github/newOnGitHub'
import type { CommandContext, UserIdentity } from './types'

type SeedTarget = 'local' | 'remote'

export type SeedStep =
  | { run: string; at?: SeedTarget; allowFailure?: boolean }
  | { write: Readonly<Record<string, string | undefined>>; at?: SeedTarget }
  | { remove: readonly string[]; at?: SeedTarget }

type SeedRemote = {
  name: string
  url: string
  cloned?: boolean
  setup?: readonly SeedStep[]
  ahead?: readonly SeedStep[]
}

export type SandboxSeed = {
  dir: string
  start?: string
  identity?: UserIdentity
  remote?: SeedRemote
  github?: GitHubSeed
  setup?: readonly SeedStep[]
}

export type PromptInfo = {
  directory: string
  branch: string | null
}

export type Sandbox = {
  run: (line: string) => Promise<RunResult>
  prompt: () => Promise<PromptInfo>
  complete: (line: string, cursor: number) => Promise<Completion>
  currentFolder: () => Promise<FolderContents>
  newOnGitHub: (branch: string) => Promise<boolean>
  snapshot: () => Promise<RepoSnapshot>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, contents: string) => Promise<void>
  reset: () => Promise<void>
}

const ROOT = '/home/user'
const SEED_EPOCH = 1700000000
const DEFAULT_IDENTITY: UserIdentity = { name: 'Your Name', email: 'you@example.com' }
const TEAMMATE_IDENTITY: UserIdentity = { name: 'Sam Rivera', email: 'sam@example.com' }

function setIdentity(ctx: CommandContext, identity: UserIdentity): void {
  setOnlyValue(ctx.globalConfig, 'user.name', identity.name)
  setOnlyValue(ctx.globalConfig, 'user.email', identity.email)
}

function createContext(github: GitHubSeed | undefined): CommandContext {
  let clock = SEED_EPOCH

  const ctx: CommandContext = {
    fs: createSandboxFs(),
    root: ROOT,
    cwd: ROOT,
    remote: null,
    github: createGitHubState(github),
    globalConfig: [],
    cutShortConfig: new Set<string>(),
    previousBranch: null,
    nextTimestamp: () => {
      clock += 60
      return clock
    },
    moveTo: (absolutePath) => {
      ctx.cwd = absolutePath
    },
    rememberBranch: (branch) => {
      ctx.previousBranch = branch
    },
  }

  return ctx
}

function contextAt(ctx: CommandContext, target: SeedTarget, dir: string): CommandContext {
  return target === 'remote' ? { ...ctx, root: dir } : ctx
}

async function applyStep(
  sandboxCtx: CommandContext,
  step: SeedStep,
  dirs: Record<SeedTarget, string>,
): Promise<void> {
  const target = step.at ?? 'local'
  const dir = dirs[target]
  const ctx = contextAt(sandboxCtx, target, dir)
  ctx.cwd = dir

  if ('write' in step) {
    for (const [path, contents] of Object.entries(step.write)) {
      if (contents === undefined) continue
      await writeText(ctx.fs, resolvePath(path, dir, ctx.root), contents)
    }
    return
  }

  if ('remove' in step) {
    for (const path of step.remove) {
      await removeTree(ctx.fs, resolvePath(path, dir, ctx.root))
    }
    return
  }

  const result = await runCommand(step.run, ctx)
  const failure = result.outputs.find((output) => output.stream === 'stderr')
  if (failure && !step.allowFailure) throw new Error(`Sandbox seed step failed: ${step.run}\n${failure.text}`)
}

async function seedContext(seed: SandboxSeed): Promise<CommandContext> {
  const ctx = createContext(seed.github)
  const identity = seed.identity ?? DEFAULT_IDENTITY
  setIdentity(ctx, identity)

  const localDir = joinPath(ROOT, seed.dir)
  await makeDirectory(ctx.fs, localDir)

  const remoteDir = seed.remote ? await createRemoteRepo(ctx, seed.remote.name) : localDir
  const dirs: Record<SeedTarget, string> = { local: localDir, remote: remoteDir }

  if (seed.remote) {
    ctx.remote = { name: seed.remote.name, url: seed.remote.url, dir: remoteDir }
    for (const step of seed.remote.setup ?? []) {
      await applyStep(ctx, { ...step, at: 'remote' }, dirs)
    }
    if (seed.remote.cloned !== false) await cloneInto(ctx, ctx.remote, localDir)
  }

  for (const step of seed.setup ?? []) await applyStep(ctx, step, dirs)
  setIdentity(ctx, TEAMMATE_IDENTITY)
  for (const step of seed.remote?.ahead ?? []) await applyStep(ctx, { ...step, at: 'remote' }, dirs)
  setIdentity(ctx, identity)

  ctx.cwd = joinPath(ROOT, seed.start ?? seed.dir)
  ctx.previousBranch = null
  return ctx
}

export async function createSandbox(
  seed: SandboxSeed,
  locks: CommandLocks = NO_LOCKS,
  access: ShellAccess = 'full',
): Promise<Sandbox> {
  let ctx = await seedContext(seed)
  let lastCommand: string | null = null
  let lastCommandFailed = false
  let lastCommandNamedCommit: string | null = null
  const projectDir = joinPath(ROOT, seed.dir)

  return {
    run: async (line) => {
      lastCommand = line
      lastCommandNamedCommit = await namedCommitMessage(ctx, line)
      const result = await runCommand(line, ctx, locks, access)
      lastCommandFailed = result.outputs.some((output) => output.stream === 'stderr')
      return result
    },
    prompt: async () => {
      const dir = await findRepoDir(ctx)
      return {
        directory: displayPath(ctx.cwd, ROOT),
        branch: dir ? await currentBranch(ctx, dir) : null,
      }
    },
    complete: (line, cursor) => completeLine(ctx, locks, line, cursor),
    currentFolder: () => readFolderContents(ctx, ctx.cwd),
    newOnGitHub: (branch) => hasNewWorkOnGitHub(ctx, branch),
    snapshot: async () => ({
      ...(await readSnapshot(ctx, projectDir)),
      lastCommand,
      lastCommandFailed,
      lastCommandNamedCommit,
    }),
    readFile: (path) => readText(ctx.fs, joinPath(projectDir, path)),
    writeFile: (path, contents) => writeText(ctx.fs, joinPath(projectDir, path), contents),
    reset: async () => {
      ctx = await seedContext(seed)
      lastCommand = null
      lastCommandFailed = false
      lastCommandNamedCommit = null
    },
  }
}
