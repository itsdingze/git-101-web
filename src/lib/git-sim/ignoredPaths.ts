import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import type { CommandContext } from './types'

const GIT_DIRECTORY_PREFIX = '.git/'

export function isIgnoredPath(
  ctx: CommandContext,
  dir: string,
  filepath: string,
): Promise<boolean> {
  return git.isIgnored({ fs: gitFs(ctx.fs), dir, filepath })
}

/** Asking for ignored rows also switches off the walker's own `.git` exclusion. */
async function unstagedWorkdirPaths(ctx: CommandContext, dir: string): Promise<string[]> {
  const rows = await git.statusMatrix({ fs: gitFs(ctx.fs), dir, ignored: true })
  return rows
    .filter(([, , workdir, stage]) => stage === 0 && workdir > 0)
    .map(([path]) => path)
    .filter((path) => !path.startsWith(GIT_DIRECTORY_PREFIX))
}

export async function readIgnoredFiles(ctx: CommandContext, dir: string): Promise<string[]> {
  const ignored: string[] = []
  for (const path of await unstagedWorkdirPaths(ctx, dir)) {
    if (await isIgnoredPath(ctx, dir, path)) ignored.push(path)
  }
  return ignored
}

async function ignoredAncestorOf(
  ctx: CommandContext,
  dir: string,
  path: string,
): Promise<string | null> {
  const segments = path.split('/')
  for (let depth = 1; depth < segments.length; depth += 1) {
    const folder = segments.slice(0, depth).join('/')
    if (await isIgnoredPath(ctx, dir, `${folder}/`)) return folder
  }
  return null
}

export async function readIgnoredEntries(ctx: CommandContext, dir: string): Promise<string[]> {
  const entries = new Set<string>()
  for (const path of await readIgnoredFiles(ctx, dir)) {
    const folder = await ignoredAncestorOf(ctx, dir, path)
    entries.add(folder === null ? path : `${folder}/`)
  }
  return [...entries].sort()
}
