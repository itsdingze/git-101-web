import git from 'isomorphic-git'
import { lastValueIn } from '@/lib/git-sim/config/configScope'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { isDirectory, pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { dirname, isInside, joinPath } from '@/lib/git-sim/fs/paths'
import { NOT_A_REPOSITORY, SandboxError, UNKNOWN_IDENTITY } from '@/lib/git-sim/errors'
import type { CommandContext, UserIdentity } from '@/lib/git-sim/types'

const VALID_HEAD = /^(ref: refs\/\S+|[0-9a-f]{40})\s*$/

export async function isRepository(ctx: CommandContext, dir: string): Promise<boolean> {
  const head = joinPath(dir, '.git/HEAD')
  if (!(await pathExists(ctx.fs, head)) || (await isDirectory(ctx.fs, head))) return false
  return VALID_HEAD.test(await readText(ctx.fs, head))
}

export async function findRepoDir(ctx: CommandContext, from: string = ctx.cwd): Promise<string | null> {
  let candidate = from
  while (isInside(candidate, ctx.root)) {
    if (await isRepository(ctx, candidate)) return candidate
    if (candidate === ctx.root) return null
    candidate = dirname(candidate)
  }
  return null
}

export async function hasRepositoryAbove(ctx: CommandContext, dir: string): Promise<boolean> {
  if (dir === ctx.root || !isInside(dir, ctx.root)) return false
  return (await findRepoDir(ctx, dirname(dir))) !== null
}

export async function requireRepoDir(ctx: CommandContext): Promise<string> {
  const dir = await findRepoDir(ctx)
  if (!dir) throw new SandboxError(NOT_A_REPOSITORY)
  return dir
}

async function readConfig(ctx: CommandContext, dir: string, path: string): Promise<string | null> {
  try {
    const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path })
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

export async function readSetting(
  ctx: CommandContext,
  dir: string,
  path: string,
): Promise<string | undefined> {
  return (await readConfig(ctx, dir, path)) ?? lastValueIn(ctx.globalConfig, path)
}

export async function resolveIdentity(ctx: CommandContext, dir: string): Promise<UserIdentity> {
  const name = await readSetting(ctx, dir, 'user.name')
  const email = await readSetting(ctx, dir, 'user.email')
  if (!name || !email) throw new SandboxError(UNKNOWN_IDENTITY)
  return { name, email }
}

export async function commitSignature(
  ctx: CommandContext,
  dir: string,
): Promise<{ name: string; email: string; timestamp: number; timezoneOffset: number }> {
  const identity = await resolveIdentity(ctx, dir)
  return { ...identity, timestamp: ctx.nextTimestamp(), timezoneOffset: 0 }
}

export async function headOid(ctx: CommandContext, dir: string): Promise<string | null> {
  try {
    return await git.resolveRef({ fs: gitFs(ctx.fs), dir, ref: 'HEAD' })
  } catch {
    return null
  }
}

export async function currentBranch(ctx: CommandContext, dir: string): Promise<string | null> {
  const branch = await git.currentBranch({ fs: gitFs(ctx.fs), dir, fullname: false })
  return branch ?? null
}

export async function refOid(
  ctx: CommandContext,
  dir: string,
  ref: string,
): Promise<string | null> {
  try {
    return await git.resolveRef({ fs: gitFs(ctx.fs), dir, ref })
  } catch {
    return null
  }
}

export function shortOid(oid: string): string {
  return oid.slice(0, 7)
}
