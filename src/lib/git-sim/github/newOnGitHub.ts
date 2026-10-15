import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { findRepoDir, refOid } from '@/lib/git-sim/history/repository'
import { hostedBaseFor } from './hostedBase'
import type { CommandContext } from '@/lib/git-sim/types'

const WALK_DEPTH = 200

async function hostedDir(ctx: CommandContext, dir: string): Promise<string | null> {
  try {
    return (await hostedBaseFor(ctx, dir)).dir
  } catch {
    return null
  }
}

async function historyOfHead(ctx: CommandContext, dir: string): Promise<string[]> {
  try {
    return (await git.log({ fs: gitFs(ctx.fs), dir, ref: 'HEAD', depth: WALK_DEPTH })).map((entry) => entry.oid)
  } catch {
    return []
  }
}

export async function hasNewWorkOnGitHub(ctx: CommandContext, branch: string): Promise<boolean> {
  const dir = await findRepoDir(ctx)
  const remoteDir = dir ? await hostedDir(ctx, dir) : null
  if (!dir || !remoteDir) return false

  const gitHubTip = await refOid(ctx, remoteDir, `refs/heads/${branch}`)
  if (!gitHubTip) return false
  return !(await historyOfHead(ctx, dir)).includes(gitHubTip)
}
