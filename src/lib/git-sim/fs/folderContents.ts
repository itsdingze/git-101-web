import { listEntries, pathExists } from './fileOperations'
import { joinPath } from './paths'
import type { CommandContext } from '@/lib/git-sim/types'

export type FolderContents = {
  files: string[]
  repositories: string[]
}

export async function filesBelow(ctx: CommandContext, dir: string, prefix = ''): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await listEntries(ctx.fs, dir)) {
    if (entry.name === '.git') continue
    const path = `${prefix}${entry.name}`
    if (entry.directory) paths.push(...(await filesBelow(ctx, joinPath(dir, entry.name), `${path}/`)))
    else paths.push(path)
  }
  return paths
}

export async function repositoriesBelow(ctx: CommandContext, dir: string, prefix = ''): Promise<string[]> {
  const found: string[] = []
  for (const entry of await listEntries(ctx.fs, dir)) {
    if (!entry.directory || entry.name.startsWith('.')) continue
    const path = `${prefix}${entry.name}`
    const folder = joinPath(dir, entry.name)
    if (await pathExists(ctx.fs, joinPath(folder, '.git'))) found.push(path)
    found.push(...(await repositoriesBelow(ctx, folder, `${path}/`)))
  }
  return found
}

export async function readFolderContents(ctx: CommandContext, dir: string): Promise<FolderContents> {
  return { files: await filesBelow(ctx, dir), repositories: await repositoriesBelow(ctx, dir) }
}
