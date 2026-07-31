import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { currentBranch, refOid } from '@/lib/git-sim/repository'
import { copyObjects, remoteDirFor, remoteExists, remoteUrl } from '@/lib/git-sim/remoteTransfer'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

export type FetchResult = {
  header: string
  remoteName: string
  branch: string
  fetchedOid: string | null
}

export async function resolveRemoteName(ctx: CommandContext, dir: string): Promise<string> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  const first = remotes[0]
  if (!first) throw new SandboxError('fatal: No remote repository specified.')
  return first.remote
}

export async function fetchFromRemote(
  ctx: CommandContext,
  dir: string,
  remoteName: string,
  branch: string,
): Promise<FetchResult> {
  if (!(await remoteExists(ctx, remoteName))) {
    const url = await remoteUrl(ctx, dir, remoteName)
    throw new SandboxError(
      [`fatal: '${url}' does not appear to be a git repository`, 'fatal: Could not read from remote repository.'].join('\n'),
    )
  }

  const remoteDir = remoteDirFor(ctx, remoteName)
  await copyObjects(ctx, remoteDir, dir)

  const fetchedOid = await refOid(ctx, remoteDir, `refs/heads/${branch}`)
  const trackingRef = `refs/remotes/${remoteName}/${branch}`
  const previous = await refOid(ctx, dir, trackingRef)

  if (fetchedOid) {
    await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: trackingRef, value: fetchedOid, force: true })
  }

  const url = await remoteUrl(ctx, dir, remoteName)
  const line = previous
    ? ` * branch            ${branch.padEnd(10)} -> FETCH_HEAD`
    : ` * [new branch]      ${branch.padEnd(10)} -> ${remoteName}/${branch}`

  return {
    header: fetchedOid ? [`From ${url.replace(/\.git$/, '')}`, line].join('\n') : `From ${url.replace(/\.git$/, '')}`,
    remoteName,
    branch,
    fetchedOid,
  }
}

export const fetch: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const operands = operandsOf(args)
    const remoteName = operands[0] ?? (await resolveRemoteName(ctx, dir))
    const branch = operands[1] ?? (await currentBranch(ctx, dir)) ?? 'main'

    const result = await fetchFromRemote(ctx, dir, remoteName, branch)
    return say(result.header)
  },
}
