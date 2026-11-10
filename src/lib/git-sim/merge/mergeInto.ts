import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { stageTreeChanges } from '@/lib/git-sim/working-tree/stageTreeChanges'
import { isAncestor } from '@/lib/git-sim/history/ancestry'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { commitSignature, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { readCommitFiles, readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import { SandboxError } from '@/lib/git-sim/errors'
import { FAST_FORWARD_ONLY } from '@/lib/git-sim/remote/pullStrategy'
import { compareTrees, formatDiffStat, formatModeChanges } from '@/lib/git-sim/diff/diffStat'
import { changedPaths, readDirtyWork, restoreDirtyWork } from '@/lib/git-sim/working-tree/dirtyWork'
import { bestMergeBases, directMergeTarget, reparentMerge } from './mergeBase'
import { branchToMergeOnto } from './mergeGuards'
import { guardFastForward, guardTrueMerge } from './localChangeGuards'
import { conflictsOf } from './conflictError'
import { pauseAtConflicts } from './conflictPause'
import { beginMerge } from './mergeInProgress'
import { readMergeTrees } from './mergeTrees'
import { mergeReportLines, NO_CONFLICTS } from './mergeReport'
import type { CommandContext } from '@/lib/git-sim/types'

const SQUASH_NOTE = 'Squash commit -- not updating HEAD'
const STOPPED_BEFORE_COMMIT = 'Automatic merge went well; stopped before committing as requested'

type Incoming = { ref: string; label: string }

type MergeSides = { ours: string; theirs: string }

type MergeResult = { alreadyMerged?: boolean; fastForward?: boolean; oid?: string }

export type FastForwardMode = 'allow' | 'never' | 'only'

type StopBeforeCommit = 'squash' | 'no-commit'

type MergeOptions = {
  message?: string
  fastForward?: FastForwardMode
  stopBeforeCommit?: StopBeforeCommit
}

type HistoryMerge = { message: string; label: string; allowFastForward: boolean; stopBeforeCommit?: StopBeforeCommit }

async function fastForwardTo(ctx: CommandContext, dir: string, ours: string, theirOid: string): Promise<MergeResult> {
  await git.writeRef({ fs: gitFs(ctx.fs), dir, ref: `refs/heads/${ours}`, value: theirOid, force: true })
  return { alreadyMerged: false, fastForward: true }
}

async function mergeHistories(
  ctx: CommandContext,
  dir: string,
  sides: MergeSides,
  { message, label, allowFastForward, stopBeforeCommit }: HistoryMerge,
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
      noUpdateBranch: stopBeforeCommit !== undefined,
    })
    if (target.parents && result.oid && !stopBeforeCommit) await reparentMerge(ctx, dir, sides.ours, result.oid, target.parents)
    return result
  } catch (error) {
    const conflicts = conflictsOf(error)
    if (conflicts) {
      await pauseAtConflicts(ctx, dir, { sides, label, theirMarker: target.theirs }, conflicts, message, stopBeforeCommit === 'squash')
    }
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

function diffSummary(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>): string[] {
  const deltas = compareTrees(before, after)
  return [formatDiffStat(deltas), ...formatModeChanges(deltas)].filter(Boolean)
}

async function squashFastForward(
  ctx: CommandContext,
  dir: string,
  before: string,
  beforeFiles: ReadonlyMap<string, string>,
  theirOid: string,
): Promise<string> {
  const incoming = await readCommitFiles(ctx, dir, theirOid)
  await stageTreeChanges(ctx, dir, beforeFiles, incoming)
  return [`Updating ${shortOid(before)}..${shortOid(theirOid)}`, 'Fast-forward', SQUASH_NOTE, ...diffSummary(beforeFiles, incoming)].join('\n')
}

async function stopBeforeRecording(
  ctx: CommandContext,
  dir: string,
  mergedOid: string,
  beforeFiles: ReadonlyMap<string, string>,
  stop: StopBeforeCommit,
  merge: { before: string; theirOid: string; message: string; label: string },
): Promise<string> {
  await stageTreeChanges(ctx, dir, beforeFiles, await readCommitFiles(ctx, dir, mergedOid))
  if (stop === 'no-commit') await beginMerge(ctx, dir, { theirs: merge.theirOid, conflicted: [], message: merge.message })

  const autoMerged = mergeReportLines(await readMergeTrees(ctx, dir, merge.before, merge.theirOid), NO_CONFLICTS, {
    ours: 'HEAD',
    theirs: merge.label,
  })
  return [...autoMerged, ...(stop === 'squash' ? [SQUASH_NOTE] : []), STOPPED_BEFORE_COMMIT].join('\n')
}

export async function mergeInto(
  ctx: CommandContext,
  dir: string,
  incoming: Incoming,
  title: string,
  options: MergeOptions = {},
): Promise<string> {
  const { fastForward: fastForwardMode = 'allow', stopBeforeCommit } = options
  const theirs = incoming.ref
  const ours = await branchToMergeOnto(ctx, dir)

  const before = await headOid(ctx, dir)
  const beforeFiles = await readCommitFilesOrEmpty(ctx, dir, before)
  const theirOid = (await refOid(ctx, dir, theirs)) ?? theirs

  if (before && (await isAncestor(ctx, dir, theirOid, before))) return 'Already up to date.'

  const possible = before !== null && (await isAncestor(ctx, dir, before, theirOid))
  if (fastForwardMode === 'only' && before && !possible) throw new SandboxError(FAST_FORWARD_ONLY)

  const work = await readDirtyWork(ctx, dir)
  const fastForward = fastForwardMode !== 'never' && possible
  if (before && fastForward) {
    guardFastForward(work, await incomingChanges(ctx, dir, before, theirOid), before, theirOid)
  } else if (before) {
    const [base] = await bestMergeBases(ctx, dir, before, theirOid)
    guardTrueMerge(work, await incomingChanges(ctx, dir, base ?? before, theirOid))
  }

  if (stopBeforeCommit === 'squash' && fastForward && before) {
    return squashFastForward(ctx, dir, before, beforeFiles, theirOid)
  }

  const message = options.message ?? `${title}${intoSuffix(ours)}`
  const stopping = fastForward ? undefined : stopBeforeCommit
  let result: MergeResult
  let stopReport: string | null = null
  try {
    result = fastForward
      ? await fastForwardTo(ctx, dir, ours, theirOid)
      : await mergeHistories(ctx, dir, { ours, theirs }, {
          message,
          label: incoming.label,
          allowFastForward: fastForwardMode !== 'never',
          stopBeforeCommit: stopping,
        })

    if (result.alreadyMerged) return 'Already up to date.'
    if (stopping && result.oid && before) {
      stopReport = await stopBeforeRecording(ctx, dir, result.oid, beforeFiles, stopping, { before, theirOid, message, label: incoming.label })
    } else {
      await forceCheckout(ctx, dir, ours)
    }
  } finally {
    await restoreDirtyWork(ctx, dir, work)
  }
  if (stopReport !== null) return stopReport

  const after = await headOid(ctx, dir)
  const summary = diffSummary(beforeFiles, await readCommitFilesOrEmpty(ctx, dir, after))
  await recordHeadMove(ctx, dir)

  if (result.fastForward) {
    return [
      `Updating ${before ? shortOid(before) : ''}..${after ? shortOid(after) : ''}`,
      options.message === undefined ? 'Fast-forward' : 'Fast-forward (no commit created; -m option ignored)',
      ...summary,
    ].join('\n')
  }

  const autoMerged = before ? mergeReportLines(await readMergeTrees(ctx, dir, before, theirOid), NO_CONFLICTS, { ours: 'HEAD', theirs: incoming.label }) : []
  return [...autoMerged, `Merge made by the 'ort' strategy.`, ...summary].join('\n')
}
