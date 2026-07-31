import git from 'isomorphic-git'
import { createSandboxFs, gitFs } from './sandboxFs'
import { makeDirectory, removeTree, writeText } from './fileOperations'
import { displayPath, joinPath, resolvePath } from './paths'
import { currentBranch, findRepoDir, refOid } from './repository'
import { copyObjects, createRemoteRepo } from './remoteTransfer'
import { runCommand, type RunResult } from './runCommand'
import { readSnapshot, type RepoSnapshot } from './snapshot'
import type { CommandContext, UserIdentity } from './types'

export type SeedTarget = 'local' | 'remote'

/**
 * `write` tolerates `undefined` values because TypeScript normalises sibling
 * object literals in a seed array, adding `key?: undefined` to each member.
 */
export type SeedStep =
  | { run: string; at?: SeedTarget }
  | { write: Readonly<Record<string, string | undefined>>; at?: SeedTarget }
  | { remove: readonly string[]; at?: SeedTarget }

export type SeedRemote = {
  name: string
  url: string
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
  if (failure) throw new Error(`Sandbox seed step failed: ${step.run}\n${failure.text}`)
}

async function cloneFromRemote(
  ctx: CommandContext,
  remoteDir: string,
  localDir: string,
  remote: SeedRemote,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  await makeDirectory(ctx.fs, localDir)
  await git.init({ fs, dir: localDir, defaultBranch: 'main' })
  await copyObjects(ctx, remoteDir, localDir)
  await git.addRemote({ fs, dir: localDir, remote: remote.name, url: remote.url })

  for (const name of await git.listBranches({ fs, dir: remoteDir })) {
    const oid = await refOid(ctx, remoteDir, `refs/heads/${name}`)
    if (!oid) continue
    await git.writeRef({ fs, dir: localDir, ref: `refs/heads/${name}`, value: oid, force: true })
    await git.writeRef({
      fs,
      dir: localDir,
      ref: `refs/remotes/${remote.name}/${name}`,
      value: oid,
      force: true,
    })
    await git.setConfig({ fs, dir: localDir, path: `branch.${name}.remote`, value: remote.name })
    await git.setConfig({
      fs,
      dir: localDir,
      path: `branch.${name}.merge`,
      value: `refs/heads/${name}`,
    })
  }

  const head = (await currentBranch(ctx, remoteDir)) ?? 'main'
  await git.checkout({ fs, dir: localDir, ref: head, force: true })
}

async function seedContext(seed: SandboxSeed): Promise<CommandContext> {
  const ctx = createContext()
  const identity = seed.identity ?? DEFAULT_IDENTITY
  ctx.globalConfig.set('user.name', identity.name)
  ctx.globalConfig.set('user.email', identity.email)

  const localDir = joinPath(ROOT, seed.dir)
  await makeDirectory(ctx.fs, localDir)

  const remoteDir = seed.remote ? await createRemoteRepo(ctx, seed.remote.name) : localDir
  const dirs: Record<SeedTarget, string> = { local: localDir, remote: remoteDir }

  if (seed.remote) {
    ctx.remote = { name: seed.remote.name, url: seed.remote.url, dir: remoteDir }
    for (const step of seed.remote.setup ?? []) {
      await applyStep(ctx, { ...step, at: 'remote' }, dirs)
    }
    await cloneFromRemote(ctx, remoteDir, localDir, seed.remote)
  }

  for (const step of seed.setup ?? []) await applyStep(ctx, step, dirs)
  for (const step of seed.remote?.ahead ?? []) await applyStep(ctx, { ...step, at: 'remote' }, dirs)

  ctx.cwd = localDir
  ctx.previousBranch = null
  return ctx
}

export async function createSandbox(seed: SandboxSeed): Promise<Sandbox> {
  let ctx = await seedContext(seed)

  return {
    run: (line) => runCommand(line, ctx),
    prompt: async () => {
      const dir = await findRepoDir(ctx)
      return {
        directory: displayPath(ctx.cwd, ROOT),
        branch: dir ? await currentBranch(ctx, dir) : null,
      }
    },
    snapshot: () => readSnapshot(ctx),
    reset: async () => {
      ctx = await seedContext(seed)
    },
  }
}
