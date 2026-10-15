import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import { bestMergeBases } from './mergeBase'
import type { MergeTrees } from './mergeReport'
import type { CommandContext } from '@/lib/git-sim/types'

export async function readMergeTrees(ctx: CommandContext, dir: string, ours: string, theirs: string): Promise<MergeTrees> {
  const [baseOid] = await bestMergeBases(ctx, dir, ours, theirs)
  return {
    base: await readCommitFilesOrEmpty(ctx, dir, baseOid ?? null),
    ours: await readCommitFiles(ctx, dir, ours),
    theirs: await readCommitFiles(ctx, dir, theirs),
  }
}
