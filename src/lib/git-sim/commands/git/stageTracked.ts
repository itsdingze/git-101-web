import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import type { CommandContext } from '@/lib/git-sim/types'

export async function stageTrackedChanges(ctx: CommandContext, dir: string): Promise<void> {
  const tree = await readWorkingTree(ctx, dir)
  for (const change of tree.unstaged) {
    if (change.kind === 'deleted') await git.remove({ fs: gitFs(ctx.fs), dir, filepath: change.path })
    else await git.add({ fs: gitFs(ctx.fs), dir, filepath: change.path })
  }
}
