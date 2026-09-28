import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandContext } from '@/lib/git-sim/types'

export type Upstream = {
  remote: string
  branch: string
}

async function readBranchConfig(
  ctx: CommandContext,
  dir: string,
  path: string,
): Promise<string | null> {
  const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path })
  return typeof value === 'string' ? value : null
}

export function remoteRefOf(upstream: Upstream): string {
  return `${upstream.remote}/${upstream.branch}`
}

export async function readUpstream(
  ctx: CommandContext,
  dir: string,
  branch: string,
): Promise<Upstream | null> {
  const remote = await readBranchConfig(ctx, dir, `branch.${branch}.remote`)
  const merge = await readBranchConfig(ctx, dir, `branch.${branch}.merge`)
  if (!remote || !merge) return null
  return { remote, branch: merge.replace(/^refs\/heads\//, '') }
}

export async function setUpstream(
  ctx: CommandContext,
  dir: string,
  branch: string,
  upstream: Upstream,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  await git.setConfig({ fs, dir, path: `branch.${branch}.remote`, value: upstream.remote })
  await git.setConfig({
    fs,
    dir,
    path: `branch.${branch}.merge`,
    value: `refs/heads/${upstream.branch}`,
  })
}
