import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandContext } from '@/lib/git-sim/types'

export async function isAncestor(
  ctx: CommandContext,
  dir: string,
  ancestor: string,
  oid: string,
): Promise<boolean> {
  if (ancestor === oid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid, ancestor, depth: -1 })
}
