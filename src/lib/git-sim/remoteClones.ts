import git from 'isomorphic-git'
import { gitFs } from './sandboxFs'
import { listEntries } from './fileOperations'
import { joinPath } from './paths'
import { isRepository } from './repository'
import type { CommandContext } from './types'

async function clonedFrom(ctx: CommandContext, dir: string, url: string): Promise<boolean> {
  if (!(await isRepository(ctx, dir))) return false
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.some((entry) => entry.url === url)
}

export async function readRemoteClones(ctx: CommandContext): Promise<string[]> {
  const url = ctx.remote?.url
  if (!url) return []

  const folders = (await listEntries(ctx.fs, ctx.root)).filter(
    (entry) => entry.directory && !entry.name.startsWith('.'),
  )
  const clones: string[] = []
  for (const folder of folders) {
    if (await clonedFrom(ctx, joinPath(ctx.root, folder.name), url)) clones.push(folder.name)
  }
  return clones
}
