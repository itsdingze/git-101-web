import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isDirectory, listEntries, pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { clearCheckoutBlockers } from '@/lib/git-sim/fs/pathBlockers'
import type { CommandContext } from '@/lib/git-sim/types'

function foldersOf(path: string): string[] {
  const parts = path.split('/')
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'))
}

async function removeTracked(ctx: CommandContext, dir: string, path: string, tracked: readonly string[]): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const entry of tracked.filter((candidate) => candidate === path || candidate.startsWith(`${path}/`))) {
    await git.remove({ fs, dir, filepath: entry })
  }
  const absolute = joinPath(dir, path)
  if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
}

export async function forceCheckout(ctx: CommandContext, dir: string, ref: string): Promise<void> {
  const fs = gitFs(ctx.fs)
  const target = await git.listFiles({ fs, dir, ref })
  const current = await git.listFiles({ fs, dir })
  const targetFiles = new Set(target)
  const targetFolders = new Set(target.flatMap(foldersOf))
  const currentFolders = new Set(current.flatMap(foldersOf))

  const swapped = [
    ...current.filter((path) => targetFolders.has(path)),
    ...[...currentFolders].filter((folder) => targetFiles.has(folder)),
  ]
  for (const path of swapped) await removeTracked(ctx, dir, path, current)
  await clearCheckoutBlockers(ctx, dir, target)

  await git.checkout({ fs, dir, ref, force: true })
  await pruneEmptiedFolders(ctx, dir, [...currentFolders].filter((folder) => !targetFolders.has(folder)))
}

async function pruneEmptiedFolders(ctx: CommandContext, dir: string, folders: readonly string[]): Promise<void> {
  const deepestFirst = [...folders].sort((a, b) => b.split('/').length - a.split('/').length)
  for (const folder of deepestFirst) {
    const absolute = joinPath(dir, folder)
    if ((await isDirectory(ctx.fs, absolute)) && (await listEntries(ctx.fs, absolute)).length === 0) {
      await removeTree(ctx.fs, absolute)
    }
  }
}
