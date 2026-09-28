import { createSandboxFs } from './fs/sandboxFs'
import { makeDirectory, removeTree, writeText } from './fs/fileOperations'
import { displayPath, joinPath, resolvePath } from './fs/paths'
import { currentBranch, findRepoDir } from './history/repository'
import { cloneInto, createRemoteRepo } from './remote/remoteTransfer'
import { runCommand, type RunResult } from './runCommand'
import { NO_LOCKS, type CommandLocks } from './input/commandLocks'
import { readSnapshot, type RepoSnapshot } from './goals/snapshot'
import type { CommandContext, UserIdentity } from './types'

export type SeedTarget = 'local' | 'remote'

/**
 * `write` tolerates `undefined` values because TypeScript normalises sibling
 * object literals in a seed array, adding `key?: undefined` to each member.
 */
export type SeedStep =
  | { run: string; at?: SeedTarget; allowFailure?: boolean }
  | { write: Readonly<Record<string, string | undefined>>; at?: SeedTarget }
  | { remove: readonly string[]; at?: SeedTarget }

export type SeedRemote = {
  name: string
  url: string
  cloned?: boolean
  setup?: readonly SeedStep[]
  ahead?: readonly SeedStep[]
}

export type SandboxSeed = {
  dir: string
  identity?: UserIdentity
  remote?: SeedRemote
  setup?: readonly SeedStep[]
}

export type PromptInfo = {
  directory: string
  branch: string | null
}

export type Sandbox = {
  run: (line: string) => Promise<RunResult>
  prompt: () => Promise<PromptInfo>
  snapshot: () => Promise<RepoSnapshot>
  reset: () => Promise<void>
}

const ROOT = '/home/user'
const SEED_EPOCH = 1700000000
const DEFAULT_IDENTITY: UserIdentity = { name: 'Your Name', email: 'you@example.com' }
const TEAMMATE_IDENTITY: UserIdentity = { name: 'Sam Rivera', email: 'sam@example.com' }

function setIdentity(ctx: CommandContext, identity: UserIdentity): void {
  for (const [key, value] of [['user.name', identity.name], ['user.email', identity.email]] as const) {
    if (value === '') ctx.globalConfig.delete(key)
    else ctx.globalConfig.set(key, value)
  }
}

function createContext(): CommandContext {
  let clock = SEED_EPOCH

  const ctx: CommandContext = {
    fs: createSandboxFs(),
    root: ROOT,
    cwd: ROOT,
    remote: null,
    globalConfig: new Map<string, string>(),
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

async function applyStep(
  ctx: CommandContext,
  step: SeedStep,
  dirs: Record<SeedTarget, string>,
): Promise<void> {
  const dir = dirs[step.at ?? 'local']
  ctx.cwd = dir

  if ('write' in step) {
    for (const [path, contents] of Object.entries(step.write)) {
      if (contents === undefined) continue
      await writeText(ctx.fs, resolvePath(path, dir, ROOT), contents)
    }
    return
  }

  if ('remove' in step) {
    for (const path of step.remove) {
      await removeTree(ctx.fs, resolvePath(path, dir, ROOT))
    }
    return
  }

  const result = await runCommand(step.run, ctx)
  const failure = result.outputs.find((output) => output.stream === 'stderr')
  if (failure && !step.allowFailure) throw new Error(`Sandbox seed step failed: ${step.run}\n${failure.text}`)
}

async function seedContext(seed: SandboxSeed): Promise<CommandContext> {
  const ctx = createContext()
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

  ctx.cwd = localDir
  ctx.previousBranch = null
  return ctx
}

export async function createSandbox(
  seed: SandboxSeed,
  locks: CommandLocks = NO_LOCKS,
): Promise<Sandbox> {
  let ctx = await seedContext(seed)
  const projectDir = joinPath(ROOT, seed.dir)

  return {
    run: (line) => runCommand(line, ctx, locks),
    prompt: async () => {
      const dir = await findRepoDir(ctx)
      return {
        directory: displayPath(ctx.cwd, ROOT),
        branch: dir ? await currentBranch(ctx, dir) : null,
      }
    },
    snapshot: () => readSnapshot(ctx, projectDir),
    reset: async () => {
      ctx = await seedContext(seed)
    },
  }
}
