import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { operandsOf, unknownFlags } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { recordHeadMove } from '@/lib/git-sim/history/headHistory'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, removeTree, writeText } from '@/lib/git-sim/fs/fileOperations'
import { commitSignature, headOid, shortOid } from '@/lib/git-sim/history/repository'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { formatCommitSummary } from '@/lib/git-sim/history/commitSummary'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import {
  readCommitFiles,
  readCommitFilesOrEmpty,
  readIndexFiles,
} from '@/lib/git-sim/working-tree/treeContents'
import { readWorkingTree } from '@/lib/git-sim/working-tree/workingTree'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'
import { formatStatus } from './status'

type Inversion = ReadonlyMap<string, string | null>

type Trees = {
  head: ReadonlyMap<string, string>
  parent: ReadonlyMap<string, string>
  target: ReadonlyMap<string, string>
}

const SUPPORTED_FLAGS = ['--no-edit']

function dirtyWorkTree(paths: readonly string[]): string {
  return [
    'error: Your local changes to the following files would be overwritten by merge:',
    ...paths.map((path) => `\t${path}`),
    'Please commit your changes or stash them before you merge.',
    'Aborting',
    'fatal: revert failed',
  ].join('\n')
}

function conflictedRevert(paths: readonly string[], oid: string, subject: string): string {
  return [
    ...paths.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
    `error: could not revert ${shortOid(oid)}... ${subject}`,
  ].join('\n')
}

function mergeWithoutMainline(oid: string): string {
  return [
    `error: commit ${oid} is a merge but no -m option was given.`,
    'fatal: revert failed',
  ].join('\n')
}

function revertMessage(subject: string, oid: string): string {
  return `${subject}\n\nThis reverts commit ${oid}.\n`
}

function invertChanges(
  parent: ReadonlyMap<string, string>,
  target: ReadonlyMap<string, string>,
): Inversion {
  const inversion = new Map<string, string | null>()
  for (const path of new Set([...parent.keys(), ...target.keys()])) {
    const restored = parent.get(path)
    if (restored === target.get(path)) continue
    inversion.set(path, restored ?? null)
  }
  return inversion
}

function changesNothing(head: ReadonlyMap<string, string>, inversion: Inversion): boolean {
  return [...inversion].every(([path, contents]) => (head.get(path) ?? null) === contents)
}

function conflictedPaths(trees: Trees, inversion: Inversion): string[] {
  return [...inversion.keys()]
    .filter((path) => trees.head.get(path) !== trees.target.get(path))
    .filter((path) => trees.head.get(path) !== trees.parent.get(path))
    .sort()
}

async function readRevertable(
  ctx: CommandContext,
  dir: string,
  oid: string,
): Promise<ReadCommitResult['commit']> {
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
  if (commit.parent.length > 1) throw new SandboxError(mergeWithoutMainline(oid))
  return commit
}

async function readTrees(
  ctx: CommandContext,
  dir: string,
  target: string,
  parent: string | null,
): Promise<Trees> {
  return {
    head: await readCommitFilesOrEmpty(ctx, dir, await headOid(ctx, dir)),
    parent: await readCommitFilesOrEmpty(ctx, dir, parent),
    target: await readCommitFiles(ctx, dir, target),
  }
}

async function refuseWhenDirty(
  ctx: CommandContext,
  dir: string,
  inversion: Inversion,
): Promise<void> {
  const tree = await readWorkingTree(ctx, dir)
  const collisions = tree.unstaged.filter((change) => inversion.has(change.path))
  if (tree.staged.length === 0 && collisions.length === 0) return

  const paths = [...tree.staged, ...collisions].map((change) => change.path)
  throw new SandboxError(dirtyWorkTree([...new Set(paths)].sort()))
}

function refuseWhenConflicted(
  trees: Trees,
  inversion: Inversion,
  target: string,
  subject: string,
): void {
  const conflicts = conflictedPaths(trees, inversion)
  if (conflicts.length > 0) throw new SandboxError(conflictedRevert(conflicts, target, subject))
}

async function applyInversion(
  ctx: CommandContext,
  dir: string,
  inversion: Inversion,
): Promise<void> {
  for (const [path, contents] of inversion) {
    const absolute = joinPath(dir, path)
    if (contents === null) {
      if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
      await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
      continue
    }
    await writeText(ctx.fs, absolute, contents)
    await git.add({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
}

async function recordRevert(
  ctx: CommandContext,
  dir: string,
  before: ReadonlyMap<string, string>,
  message: string,
): Promise<string> {
  const after = await readIndexFiles(ctx, dir)
  const author = await commitSignature(ctx, dir)
  const oid = await git.commit({ fs: gitFs(ctx.fs), dir, message, author, committer: author })

  return formatCommitSummary(ctx, dir, {
    oid,
    before,
    after,
    rootCommit: false,
    showAuthorDate: false,
  })
}

const REVERT_USAGE = [
  'usage: git revert [--[no-]edit] [-n] [-m <parent-number>] [-s] [-S[<keyid>]] <commit>...',
  '   or: git revert (--continue | --skip | --abort | --quit)',
].join('\n')

export const revert: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const unsupported = unknownFlags(args, SUPPORTED_FLAGS)[0]
    if (unsupported) {
      throw new SandboxError(`fatal: git revert ${unsupported} is not simulated in this course.`)
    }

    const spec = operandsOf(args)[0]
    if (!spec) throw new SandboxError(REVERT_USAGE)
    const target = await resolveCommitish(ctx, dir, spec)
    if (!target) throw new SandboxError(`fatal: bad revision '${spec}'`)

    const commit = await readRevertable(ctx, dir, target)
    const trees = await readTrees(ctx, dir, target, commit.parent[0] ?? null)
    const inversion = invertChanges(trees.parent, trees.target)
    await refuseWhenDirty(ctx, dir, inversion)

    const undone = commitSubject(commit.message)
    refuseWhenConflicted(trees, inversion, target, undone)
    if (changesNothing(trees.head, inversion)) throw new SandboxError(await formatStatus(ctx, dir))

    await applyInversion(ctx, dir, inversion)
    const message = revertMessage(`Revert "${undone}"`, target)
    const summary = await recordRevert(ctx, dir, trees.head, message)
    await recordHeadMove(ctx, dir, `revert: ${commitSubject(message)}`)

    return say(summary)
  },
}
