import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { repositoriesBelow } from '@/lib/git-sim/fs/folderContents'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { isRepository } from '@/lib/git-sim/history/repository'
import { hostedRemoteAt } from './remoteConnection'
import type { CommandContext } from '@/lib/git-sim/types'

async function clonedFromHostedRemote(ctx: CommandContext, dir: string): Promise<boolean> {
  if (!(await isRepository(ctx, dir))) return false
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.some((entry) => hostedRemoteAt(ctx, entry.url) !== null)
}

export async function readRemoteClones(ctx: CommandContext): Promise<string[]> {
  if (!ctx.remote) return []

  const folders = await repositoriesBelow(ctx, ctx.root)
  const clones: string[] = []
  for (const folder of folders) {
    if (await clonedFromHostedRemote(ctx, joinPath(ctx.root, folder))) clones.push(folder)
  }
  return clones
}
