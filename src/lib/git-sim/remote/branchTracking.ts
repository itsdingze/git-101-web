import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { refOid } from '@/lib/git-sim/history/repository'
import { readUpstream, remoteRefOf } from './upstream'
import type { CommandContext } from '@/lib/git-sim/types'

type TrackingSummary = {
  remoteRef: string
  ahead: number
  behind: number
}

const WALK_DEPTH = 200

async function oidsFor(ctx: CommandContext, dir: string, ref: string): Promise<string[]> {
  try {
    const commits = await git.log({ fs: gitFs(ctx.fs), dir, ref, depth: WALK_DEPTH })
    return commits.map((entry) => entry.oid)
  } catch {
    return []
  }
}

export async function readTracking(
  ctx: CommandContext,
  dir: string,
  branch: string,
): Promise<TrackingSummary | null> {
  const upstream = await readUpstream(ctx, dir, branch)
  return upstream ? compareWithRemote(ctx, dir, branch, remoteRefOf(upstream)) : null
}

export async function compareWithRemote(
  ctx: CommandContext,
  dir: string,
  branch: string,
  remoteRef: string,
): Promise<TrackingSummary | null> {
  if (!(await refOid(ctx, dir, `refs/remotes/${remoteRef}`))) return null

  const local = await oidsFor(ctx, dir, branch)
  const tracked = await oidsFor(ctx, dir, `refs/remotes/${remoteRef}`)
  const localSet = new Set(local)
  const trackedSet = new Set(tracked)

  return {
    remoteRef,
    ahead: local.filter((oid) => !trackedSet.has(oid)).length,
    behind: tracked.filter((oid) => !localSet.has(oid)).length,
  }
}

export function describeTracking(summary: TrackingSummary): string {
  const { remoteRef, ahead, behind } = summary

  if (ahead === 0 && behind === 0) return `Your branch is up to date with '${remoteRef}'.`
  if (behind === 0) {
    return [
      `Your branch is ahead of '${remoteRef}' by ${ahead} commit${ahead === 1 ? '' : 's'}.`,
      '  (use "git push" to publish your local commits)',
    ].join('\n')
  }
  if (ahead === 0) {
    return [
      `Your branch is behind '${remoteRef}' by ${behind} commit${behind === 1 ? '' : 's'}, and can be fast-forwarded.`,
      '  (use "git pull" to update your local branch)',
    ].join('\n')
  }
  return [
    `Your branch and '${remoteRef}' have diverged,`,
    `and have ${ahead} and ${behind} different commits each, respectively.`,
    '  (use "git pull" if you want to integrate the remote branch with yours)',
  ].join('\n')
}
