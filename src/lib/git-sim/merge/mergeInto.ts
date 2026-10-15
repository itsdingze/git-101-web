import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { commitSignature, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import { compareTrees, formatDiffStat, formatModeChanges } from '@/lib/git-sim/diff/diffStat'
import { changedPaths, readDirtyWork, restoreDirtyWork } from '@/lib/git-sim/working-tree/dirtyWork'
import { bestMergeBases, directMergeTarget, reparentMerge } from './mergeBase'
import { branchToMergeOnto } from './mergeGuards'
import { guardFastForward, guardTrueMerge } from './localChangeGuards'
import { conflictsOf } from './conflictError'
import { pauseAtConflicts } from './conflictPause'
import { readMergeTrees } from './mergeTrees'
import { mergeReportLines, NO_CONFLICTS } from './mergeReport'
import type { CommandContext } from '@/lib/git-sim/types'

type Incoming = { ref: string; label: string }

type MergeSides = { ours: string; theirs: string }

type MergeResult = { alreadyMerged?: boolean; fastForward?: boolean }

async function isAncestor(
  ctx: CommandContext,
  dir: string,
  ancestor: string,
  oid: string,
): Promise<boolean> {
  if (ancestor === oid) return true
  return git.isDescendent({ fs: gitFs(ctx.fs), dir, oid, ancestor, depth: -1 })
}

async function fastForwardTo(ctx: CommandContext, dir: string, ours: string, theirOid: string): Promise<MergeResult> {
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: `refs/heads/${ours}`, value: theirOid, force: true })
  return { alreadyMerged: false, fastForward: true }
}

async function mergeHistories(
  ctx: CommandContext,
  dir: string,
  sides: MergeSides,
  message: string,
  label: string,
  allowFastForward: boolean,
): Promise<MergeResult> {
  const author = await commitSignature(ctx, dir)
  const target = await directMergeTarget(ctx, dir, sides.theirs)
  try {
    const result = await git.merge({
      fs: gitFs(ctx.fs),
      dir,
      ours: sides.ours,
      theirs: target.theirs,
      author,
      committer: author,
      message,
      abortOnConflict: false,
      fastForward: allowFastForward,
    })
    if (target.parents && result.oid) await reparentMerge(ctx, dir, sides.ours, result.oid, target.parents)
    return result
  } catch (error) {
    const conflicts = conflictsOf(error)
    if (conflicts) await pauseAtConflicts(ctx, dir, { sides, label, theirMarker: target.theirs }, conflicts, message)
    throw error
  }
}

async function incomingChanges(
  ctx: CommandContext,
  dir: string,
  from: string,
  theirOid: string,
): Promise<Set<string>> {
  return changedPaths(await readCommitFilesOrEmpty(ctx, dir, from), await readCommitFiles(ctx, dir, theirOid))
}

function intoSuffix(ours: string): string {
  return ours === 'main' || ours === 'master' ? '' : ` into ${ours}`
}

export async function mergeInto(
  ctx: CommandContext,
  dir: string,
  incoming: Incoming,
  title: string,
  givenMessage?: string,
  allowFastForward = true,
): Promise<string> {
  const theirs = incoming.ref
  const ours = await branchToMergeOnto(ctx, dir)

  const before = await headOid(ctx, dir)
  const beforeFiles = await readCommitFilesOrEmpty(ctx, dir, before)
  const theirOid = (await refOid(ctx, dir, theirs)) ?? theirs

  if (before && (await isAncestor(ctx, dir, theirOid, before))) return 'Already up to date.'

  const work = await readDirtyWork(ctx, dir)
  const fastForward = allowFastForward && before !== null && (await isAncestor(ctx, dir, before, theirOid))
  if (before && fastForward) {
    guardFastForward(work, await incomingChanges(ctx, dir, before, theirOid), before, theirOid)
  } else if (before) {
    const [base] = await bestMergeBases(ctx, dir, before, theirOid)
    guardTrueMerge(work, await incomingChanges(ctx, dir, base ?? before, theirOid))
  }

  const message = givenMessage ?? `${title}${intoSuffix(ours)}`
  let result: MergeResult
  try {
    result = fastForward
      ? await fastForwardTo(ctx, dir, ours, theirOid)
      : await mergeHistories(ctx, dir, { ours, theirs }, message, incoming.label, allowFastForward)

    if (result.alreadyMerged) return 'Already up to date.'
    await forceCheckout(ctx, dir, ours)
  } finally {
    await restoreDirtyWork(ctx, dir, work)
  }

  const after = await headOid(ctx, dir)
  const deltas = compareTrees(beforeFiles, await readCommitFilesOrEmpty(ctx, dir, after))
  const summary = [formatDiffStat(deltas), ...formatModeChanges(deltas)].filter(Boolean)
  await recordHeadMove(ctx, dir)

  if (result.fastForward) {
    return [
      `Updating ${before ? shortOid(before) : ''}..${after ? shortOid(after) : ''}`,
      'Fast-forward',
      ...summary,
    ].join('\n')
  }

  const autoMerged = before ? mergeReportLines(await readMergeTrees(ctx, dir, before, theirOid), NO_CONFLICTS, { ours: 'HEAD', theirs: incoming.label }) : []
  return [...autoMerged, `Merge made by the 'ort' strategy.`, ...summary].join('\n')
}
