import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { headOid, refOid } from '@/lib/git-sim/history/repository'
import type { CommandContext } from '@/lib/git-sim/types'

async function isStrictAncestor(ctx: CommandContext, dir: string, ancestor: string, oid: string): Promise<boolean> {
  return ancestor !== oid && git.isDescendent({ fs: gitFs(ctx.fs), dir, oid, ancestor, depth: -1 })
}

export async function bestMergeBases(ctx: CommandContext, dir: string, ours: string, theirs: string): Promise<string[]> {
  const bases = (await git.findMergeBase({ fs: gitFs(ctx.fs), dir, oids: [ours, theirs] })) as string[]
  const best: string[] = []
  for (const base of bases) {
    const superseded = await Promise.all(bases.map((other) => isStrictAncestor(ctx, dir, base, other)))
    if (!superseded.some(Boolean)) best.push(base)
  }
  return best
}

async function standInCommit(ctx: CommandContext, dir: string, theirOid: string, base: string): Promise<string> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: theirOid })
  return git.writeCommit({ fs: gitFs(ctx.fs), dir, commit: { ...commit, parent: [base] } })
}

// isomorphic-git's merge-base walk can return non-minimal bases and then throws MergeNotSupportedError on shapes real git merges.
export async function directMergeTarget(
  ctx: CommandContext,
  dir: string,
  theirs: string,
): Promise<{ theirs: string; parents: string[] | null }> {
  const ourOid = await headOid(ctx, dir)
  const theirOid = (await refOid(ctx, dir, theirs)) ?? theirs
  if (!ourOid) return { theirs, parents: null }

  const found = (await git.findMergeBase({ fs: gitFs(ctx.fs), dir, oids: [ourOid, theirOid] })) as string[]
  const best = await bestMergeBases(ctx, dir, ourOid, theirOid)
  if (!best[0] || (found.length <= 1 && best.length <= 1)) return { theirs, parents: null }

  return { theirs: await standInCommit(ctx, dir, theirOid, best[0]), parents: [ourOid, theirOid] }
}

export async function reparentMerge(
  ctx: CommandContext,
  dir: string,
  branch: string,
  mergeOid: string,
  parents: readonly string[],
): Promise<void> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: mergeOid })
  const oid = await git.writeCommit({ fs: gitFs(ctx.fs), dir, commit: { ...commit, parent: [...parents] } })
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: `refs/heads/${branch}`, value: oid, force: true })
}
