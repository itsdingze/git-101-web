import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { refOid } from '@/lib/git-sim/history/repository'
import type { CommandContext } from '@/lib/git-sim/types'

export type Upstream = {
  remote: string
  branch: string
}

const LOCAL_REMOTE = '.'

async function readBranchConfig(
  ctx: CommandContext,
  dir: string,
  path: string,
): Promise<string | null> {
  const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path })
  return typeof value === 'string' ? value : null
}

export function remoteRefOf(upstream: Upstream): string {
  return isLocalUpstream(upstream) ? upstream.branch : `${upstream.remote}/${upstream.branch}`
}

export function trackingRefOf(upstream: Upstream): string {
  return isLocalUpstream(upstream) ? `refs/heads/${upstream.branch}` : `refs/remotes/${remoteRefOf(upstream)}`
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

export async function clearUpstream(ctx: CommandContext, dir: string, branch: string): Promise<void> {
  const fs = gitFs(ctx.fs)
  await git.setConfig({ fs, dir, path: `branch.${branch}.remote`, value: undefined })
  await git.setConfig({ fs, dir, path: `branch.${branch}.merge`, value: undefined })
}

export async function remoteBranchNamed(ctx: CommandContext, dir: string, spec: string): Promise<Upstream | null> {
  const name = spec.replace(/^refs\/remotes\//, '').replace(/^remotes\//, '')
  const slash = name.indexOf('/')
  if (slash <= 0) return null

  const upstream = { remote: name.slice(0, slash), branch: name.slice(slash + 1) }
  return (await refOid(ctx, dir, trackingRefOf(upstream))) ? upstream : null
}

export function localUpstream(branch: string): Upstream {
  return { remote: LOCAL_REMOTE, branch }
}

export function isLocalUpstream(upstream: Upstream): boolean {
  return upstream.remote === LOCAL_REMOTE
}

export async function uniqueRemoteBranch(ctx: CommandContext, dir: string, name: string): Promise<Upstream | null> {
  const found: Upstream[] = []
  for (const { remote } of await git.listRemotes({ fs: gitFs(ctx.fs), dir })) {
    const upstream = { remote, branch: name }
    if (await refOid(ctx, dir, trackingRefOf(upstream))) found.push(upstream)
  }
  return found.length === 1 ? (found[0] ?? null) : null
}
