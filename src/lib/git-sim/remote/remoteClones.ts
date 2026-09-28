import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { listEntries } from '@/lib/git-sim/fs/fileOperations'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isRepository } from '@/lib/git-sim/history/repository'
import type { CommandContext } from '@/lib/git-sim/types'

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
