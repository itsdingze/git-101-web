import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { refOid, shortOid } from '@/lib/git-sim/history/repository'
import { copyObjects } from './remoteTransfer'
import { connectToRemote } from './remoteConnection'
import type { CommandContext } from '@/lib/git-sim/types'

type FetchResult = {
  header: string
  url: string
  remoteName: string
  branch: string
  fetchedOid: string | null
}

export async function firstRemoteName(ctx: CommandContext, dir: string): Promise<string | null> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes[0]?.remote ?? null
}

export async function resolveRemoteName(ctx: CommandContext, dir: string): Promise<string> {
  const name = await firstRemoteName(ctx, dir)
  if (!name) throw new SandboxError('fatal: No remote repository specified.')
  return name
}

function fetchLines(
  names: { remoteName: string; branch: string },
  refs: { previous: string | null; fetched: string },
  branchNamed: boolean,
): string[] {
  const { remoteName, branch } = names
  const tracking = `${branch.padEnd(10)} -> ${remoteName}/${branch}`
  if (!refs.previous) return [` * [new branch]      ${tracking}`]

  return [
    ...(branchNamed ? [` * branch            ${branch.padEnd(10)} -> FETCH_HEAD`] : []),
    ...(refs.previous === refs.fetched
      ? []
      : [`   ${shortOid(refs.previous)}..${shortOid(refs.fetched)}  ${tracking}`]),
  ]
}

export async function fetchFromRemote(
  ctx: CommandContext,
  dir: string,
  remoteName: string,
  branch: string,
  branchNamed = true,
): Promise<FetchResult> {
  const remote = await connectToRemote(ctx, dir, remoteName)
  await copyObjects(ctx, remote.dir, dir)

  const fetchedOid = await refOid(ctx, remote.dir, `refs/heads/${branch}`)
  const trackingRef = `refs/remotes/${remoteName}/${branch}`
  const previous = await refOid(ctx, dir, trackingRef)

  if (fetchedOid) {
    await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: trackingRef, value: fetchedOid, force: true })
  }

  const url = remote.url.replace(/\.git$/, '')
  const lines = fetchedOid ? fetchLines({ remoteName, branch }, { previous, fetched: fetchedOid }, branchNamed) : []

  return {
    header: fetchedOid && lines.length === 0 ? '' : [`From ${url}`, ...lines].join('\n'),
    url,
    remoteName,
    branch,
    fetchedOid,
  }
}
