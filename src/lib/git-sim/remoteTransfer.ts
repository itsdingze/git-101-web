import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { copyTree, pathExists } from './fileOperations'
import { joinPath } from './paths'
import type { CommandContext } from './types'

const REMOTES_ROOT = '.remotes'

export function remoteDirFor(ctx: CommandContext, name: string): string {
  return joinPath(ctx.root, `${REMOTES_ROOT}/${name}`)
}

export async function remoteExists(ctx: CommandContext, name: string): Promise<boolean> {
  return pathExists(ctx.fs, joinPath(remoteDirFor(ctx, name), '.git'))
}

export async function createRemoteRepo(ctx: CommandContext, name: string): Promise<string> {
  const dir = remoteDirFor(ctx, name)
  if (!(await remoteExists(ctx, name))) {
    await git.init({ fs: gitFs(ctx.fs), dir, defaultBranch: 'main' })
  }
  return dir
}

/** Git objects are content addressed, so a blind directory copy is a valid transfer. */
export async function copyObjects(
  ctx: CommandContext,
  fromDir: string,
  toDir: string,
): Promise<void> {
  await copyTree(ctx.fs, joinPath(fromDir, '.git/objects'), joinPath(toDir, '.git/objects'))
}

export async function remoteUrl(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<string> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.find((entry) => entry.remote === name)?.url ?? `sandbox:${name}`
}
