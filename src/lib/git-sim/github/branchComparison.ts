import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { compareTrees } from '@/lib/git-sim/diff/diffStat'
import { bestMergeBases } from '@/lib/git-sim/merge/mergeBase'
import { readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import type { CommandContext } from '@/lib/git-sim/types'

type BranchComparison = {
  messages: string[]
  additions: number
  deletions: number
}

async function messagesAhead(ctx: CommandContext, dir: string, base: string, head: string): Promise<string[]> {
  const fs = gitFs(ctx.fs)
  const reachableFromBase = new Set((await git.log({ fs, dir, ref: base })).map((entry) => entry.oid))
  return (await git.log({ fs, dir, ref: head }))
    .filter((entry) => !reachableFromBase.has(entry.oid))
    .map((entry) => entry.commit.message.trim())
    .reverse()
}

export async function compareBranches(
  ctx: CommandContext,
  dir: string,
  base: string,
  head: string,
): Promise<BranchComparison> {
  const [baseOid, headOid] = await Promise.all([base, head].map((ref) => git.resolveRef({ fs: gitFs(ctx.fs), dir, ref })))
  const [mergeBase] = await bestMergeBases(ctx, dir, baseOid ?? base, headOid ?? head)
  const deltas = compareTrees(
    await readCommitFilesOrEmpty(ctx, dir, mergeBase ?? null),
    await readCommitFilesOrEmpty(ctx, dir, headOid ?? null),
  )

  return {
    messages: await messagesAhead(ctx, dir, base, head),
    additions: deltas.reduce((sum, delta) => sum + delta.insertions, 0),
    deletions: deltas.reduce((sum, delta) => sum + delta.deletions, 0),
  }
}
