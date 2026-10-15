import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { SandboxError } from '@/lib/git-sim/errors'
import { headOid, refOid } from '@/lib/git-sim/history/repository'
import { relabelConflictMarkers } from './conflictLabels'
import { beginMerge } from './mergeInProgress'
import { readMergeTrees } from './mergeTrees'
import { allConflictedPaths, mergeReportLines, type MergeConflicts, type MergeTrees } from './mergeReport'
import type { CommandContext } from '@/lib/git-sim/types'

type ConflictNaming = {
  sides: { ours: string; theirs: string }
  label: string
  theirMarker: string
}

const EMPTY_TREES: MergeTrees = { base: new Map(), ours: new Map(), theirs: new Map() }

function conflictOutput(trees: MergeTrees, conflicts: MergeConflicts, label: string): string {
  const report = mergeReportLines(trees, conflicts, { ours: 'HEAD', theirs: label })
  return [
    ...(report.length === 0 ? [`Could not merge ${label}.`] : report),
    'Automatic merge failed; fix conflicts and then commit the result.',
  ].join('\n')
}

async function stageIncoming(
  ctx: CommandContext,
  dir: string,
  trees: MergeTrees,
  conflicted: ReadonlySet<string>,
): Promise<void> {
  const fs = gitFs(ctx.fs)
  for (const [path, contents] of trees.theirs) {
    if (conflicted.has(path) || trees.base.get(path) === contents) continue
    await git.add({ fs, dir, filepath: path, force: true })
  }

  for (const [path, contents] of trees.base) {
    if (conflicted.has(path) || trees.theirs.has(path) || trees.ours.get(path) !== contents) continue
    await git.remove({ fs, dir, filepath: path })
    const absolute = joinPath(dir, path)
    if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
  }
}

export async function pauseAtConflicts(
  ctx: CommandContext,
  dir: string,
  naming: ConflictNaming,
  conflicts: MergeConflicts,
  message: string,
): Promise<never> {
  const { sides, label, theirMarker } = naming
  const conflicted = allConflictedPaths(conflicts)
  const ourOid = await headOid(ctx, dir)
  const theirOid = (await refOid(ctx, dir, sides.theirs)) ?? sides.theirs
  const trees = ourOid ? await readMergeTrees(ctx, dir, ourOid, theirOid) : null

  await relabelConflictMarkers(
    ctx,
    dir,
    conflicts.content,
    { ours: sides.ours, theirs: theirMarker },
    { ours: 'HEAD', theirs: label },
  )
  if (trees) await stageIncoming(ctx, dir, trees, new Set(conflicted))
  await beginMerge(ctx, dir, { theirs: theirOid, conflicted, message })

  throw new SandboxError(conflictOutput(trees ?? EMPTY_TREES, conflicts, label))
}
