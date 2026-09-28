import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import { SandboxError } from '@/lib/git-sim/errors'
import { assertNoBranchNameClash } from '@/lib/git-sim/history/branchNameClash'
import { say } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { currentBranch, headOid, refOid, shortOid } from '@/lib/git-sim/history/repository'
import { readCommitFilesOrEmpty } from '@/lib/git-sim/working-tree/treeContents'
import {
  carriedChangeLines,
  changedPaths,
  dirtyPathsIn,
  lostFoldersRefusal,
  readDirtyWork,
  restoreDirtyWork,
  untrackedClashesIn,
  type DirtyWork,
} from '@/lib/git-sim/working-tree/dirtyWork'
import { endMerge } from '@/lib/git-sim/merge/mergeInProgress'
import { refuseWhileUnmerged } from '@/lib/git-sim/merge/mergeGuards'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import type { CommandContext, CommandOutput } from '@/lib/git-sim/types'

export function detachedHead(spec: string, oid: string): string {
  return [
    `fatal: checking out ${shortOid(oid)} would detach HEAD, which is not simulated in this course.`,
    `hint: name the commit instead: git switch -c <new-branch> ${spec}`,
  ].join('\n')
}

async function branchExists(ctx: CommandContext, dir: string, name: string): Promise<boolean> {
  return (await refOid(ctx, dir, `refs/heads/${name}`)) !== null
}

async function refuseNonBranch(ctx: CommandContext, dir: string, spec: string): Promise<never> {
  const commit = await resolveCommitish(ctx, dir, spec)
  throw new SandboxError(commit ? detachedHead(spec, commit) : `fatal: invalid reference: ${spec}`)
}

async function startPointOid(ctx: CommandContext, dir: string, spec: string): Promise<string> {
  const oid = await resolveCommitish(ctx, dir, spec)
  if (!oid) throw new SandboxError(`fatal: invalid reference: ${spec}`)
  return oid
}

function refusal(heading: string, paths: readonly string[], advice: string): string {
  return [heading, ...paths.map((path) => `\t${path}`), advice, 'Aborting'].join('\n')
}

async function moveCarryingWork(
  ctx: CommandContext,
  dir: string,
  targetOid: string,
  move: () => Promise<void>,
): Promise<string[]> {
  const work = await readDirtyWork(ctx, dir)
  const targetFiles = await readCommitFilesOrEmpty(ctx, dir, targetOid)
  const touched = changedPaths(await readCommitFilesOrEmpty(ctx, dir, await headOid(ctx, dir)), targetFiles)
  const alreadyThere = (path: string) => {
    const entry = work.entries.find((candidate) => candidate.path === path)
    return entry !== undefined && entry.staged !== null && (entry.indexContent ?? undefined) === targetFiles.get(path)
  }

  const dirty = dirtyPathsIn(work, touched).filter((path) => !alreadyThere(path))
  if (dirty.length > 0) {
    throw new SandboxError(
      refusal(
        'error: Your local changes to the following files would be overwritten by checkout:',
        dirty,
        'Please commit your changes or stash them before you switch branches.',
      ),
    )
  }
  const clash = untrackedClashesIn(work, touched)
  if (clash.overwritten.length > 0) {
    throw new SandboxError(
      refusal(
        'error: The following untracked working tree files would be overwritten by checkout:',
        clash.overwritten,
        'Please move or remove them before you switch branches.',
      ),
    )
  }
  if (clash.lostFolders.length > 0) throw new SandboxError(lostFoldersRefusal(clash.lostFolders).join('\n'))

  try {
    await move()
  } finally {
    await restoreDirtyWork(ctx, dir, work)
  }
  return carriedChangeLines({ ...work, entries: work.entries.filter((entry) => differsFrom(entry, targetFiles)) })
}

function differsFrom(entry: DirtyWork['entries'][number], targetFiles: ReadonlyMap<string, string>): boolean {
  const target = targetFiles.get(entry.path) ?? null
  return entry.workdirContent !== target || (entry.staged !== null && entry.indexContent !== target)
}

async function createAt(
  ctx: CommandContext,
  dir: string,
  name: string,
  object: string,
): Promise<string[]> {
  return moveCarryingWork(ctx, dir, object, async () => {
    await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, object })
    await forceCheckout(ctx, dir, name)
  })
}

async function noteMove(
  ctx: CommandContext,
  dir: string,
  from: string | null,
  to: string,
): Promise<void> {
  await recordHeadMove(ctx, dir, `checkout: moving from ${from ?? 'HEAD'} to ${to}`)
}

export async function createAndSwitch(
  ctx: CommandContext,
  dir: string,
  name: string,
  startPoint?: string,
): Promise<CommandOutput[]> {
  if (await branchExists(ctx, dir, name)) {
    throw new SandboxError(`fatal: a branch named '${name}' already exists`)
  }
  await assertNoBranchNameClash(ctx, dir, name)

  const previous = await currentBranch(ctx, dir)
  let carried: string[] = []
  if (startPoint) {
    await refuseWhileUnmerged(ctx, dir)
    carried = await createAt(ctx, dir, name, await startPointOid(ctx, dir, startPoint))
  } else {
    await git.branch({ fs: gitFs(ctx.fs), dir, ref: name, checkout: true })
  }
  await endMerge(ctx, dir)

  ctx.rememberBranch(previous)
  await noteMove(ctx, dir, previous, name)

  return say([...carried, `Switched to a new branch '${name}'`].join('\n'))
}

export async function switchTo(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<CommandOutput[]> {
  const target = name === '-' ? ctx.previousBranch : name
  if (!target) throw new SandboxError('fatal: no previous branch to switch to')

  if (!(await branchExists(ctx, dir, target))) await refuseNonBranch(ctx, dir, target)

  await refuseWhileUnmerged(ctx, dir)
  const previous = await currentBranch(ctx, dir)
  if (previous === target) {
    const carried = carriedChangeLines(await readDirtyWork(ctx, dir))
    await endMerge(ctx, dir)
    return say([...carried, `Already on '${target}'`].join('\n'))
  }

  const targetOid = await refOid(ctx, dir, `refs/heads/${target}`)
  const carried = await moveCarryingWork(ctx, dir, targetOid ?? target, async () => {
    await forceCheckout(ctx, dir, target)
  })
  await endMerge(ctx, dir)
  ctx.rememberBranch(previous)
  await noteMove(ctx, dir, previous, target)

  return say([...carried, `Switched to branch '${target}'`].join('\n'))
}
