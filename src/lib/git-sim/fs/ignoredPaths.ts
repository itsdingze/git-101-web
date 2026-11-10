import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import type { CommandContext } from '@/lib/git-sim/types'

const GIT_DIRECTORY_PREFIX = '.git/'

export function isIgnoredPath(
  ctx: CommandContext,
  dir: string,
  filepath: string,
): Promise<boolean> {
  return git.isIgnored({ fs: gitFs(ctx.fs), dir, filepath })
}

// Asking isomorphic-git for ignored rows also switches off the walker's own `.git` exclusion.
async function unstagedWorkdirPaths(ctx: CommandContext, dir: string): Promise<string[]> {
  const rows = await git.statusMatrix({ fs: gitFs(ctx.fs), dir, ignored: true, refresh: false })
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

function outermostFullyIgnoredFolder(path: string, notIgnored: readonly string[]): string {
  const segments = path.split('/')
  for (let depth = 1; depth < segments.length; depth += 1) {
    const folder = `${segments.slice(0, depth).join('/')}/`
    if (!notIgnored.some((other) => other.startsWith(folder))) return folder
  }
  return path
}

export async function readIgnoredEntries(ctx: CommandContext, dir: string, expandFolders: boolean): Promise<string[]> {
  const ignored = await readIgnoredFiles(ctx, dir)
  if (expandFolders) return [...ignored].sort()

  const ignoredSet = new Set(ignored)
  const notIgnored = [
    ...(await git.listFiles({ fs: gitFs(ctx.fs), dir })),
    ...(await unstagedWorkdirPaths(ctx, dir)).filter((path) => !ignoredSet.has(path)),
  ]
  return [...new Set(ignored.map((path) => outermostFullyIgnoredFolder(path, notIgnored)))].sort()
}
