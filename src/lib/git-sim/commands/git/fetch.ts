import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { copyObjects } from '@/lib/git-sim/remote/remoteTransfer'
import { connectToRemote } from '@/lib/git-sim/remote/remoteConnection'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

export type FetchResult = {
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

export const fetch: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const operands = operandsOf(args)
    const remoteName = operands[0] ?? (await firstRemoteName(ctx, dir))
    if (!remoteName) return silent

    const branch = operands[1] ?? (await currentBranch(ctx, dir)) ?? 'main'

    const result = await fetchFromRemote(ctx, dir, remoteName, branch, operands[1] !== undefined)
    return result.header === '' ? silent : say(result.header)
  },
}
