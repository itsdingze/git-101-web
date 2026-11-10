import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { matchAny, repoPrefix } from '@/lib/git-sim/fs/pathspec'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { placeFile } from '@/lib/git-sim/fs/pathBlockers'
import { genericConflictMarkers, remainingConflictText } from '@/lib/git-sim/merge/conflictText'
import { blobText, readCommitFiles, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readUnmergedEntries, readUnmergedStages } from '@/lib/git-sim/working-tree/indexStages'
import { headOid } from '@/lib/git-sim/history/repository'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const OURS_STAGE = 2
const THEIRS_STAGE = 3

async function restoreIndexEntries(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<void> {
  for (const path of paths) {
    await git.resetIndex({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
}

async function restoreWorkdirEntries(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<void> {
  const index = await readIndexFiles(ctx, dir)
  for (const path of paths) await placeFile(ctx, dir, path, index.get(path))
}

async function refuseUnmergedPaths(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<void> {
  const unmerged = new Set((await readUnmergedEntries(ctx, dir)).map((entry) => entry.path))
  const blocked = paths.filter((path) => unmerged.has(path))
  if (blocked.length > 0) {
    throw new SandboxError(blocked.map((path) => `error: path '${path}' is unmerged`).join('\n'))
  }
}

async function committedPaths(ctx: CommandContext, dir: string): Promise<string[]> {
  const head = await headOid(ctx, dir)
  return head ? git.listFiles({ fs: gitFs(ctx.fs), dir, ref: head }) : []
}

function matchPaths(ctx: CommandContext, dir: string, candidates: readonly string[], specs: readonly string[]): string[] {
  const prefix = repoPrefix(ctx, dir)
  const resolved = new Set<string>()
  for (const spec of specs) {
    const hits = candidates.filter(matchAny([spec], prefix))
    if (hits.length === 0) {
      throw new SandboxError(`error: pathspec '${spec}' did not match any file(s) known to git`)
    }
    for (const hit of hits) resolved.add(hit)
  }
  return [...resolved]
}

async function resolveTrackedPaths(
  ctx: CommandContext,
  dir: string,
  specs: readonly string[],
  includeCommitted = false,
): Promise<string[]> {
  const indexed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const tracked = includeCommitted ? [...new Set([...indexed, ...(await committedPaths(ctx, dir))])] : indexed
  return matchPaths(ctx, dir, tracked, specs)
}

async function readSource(ctx: CommandContext, dir: string, spec: string): Promise<Map<string, string>> {
  const oid = await resolveCommitish(ctx, dir, spec)
  if (!oid) throw new SandboxError(`fatal: could not resolve ${spec}`)
  return readCommitFiles(ctx, dir, oid)
}

type SourceTargets = { index: boolean; worktree: boolean }

async function writeIndexFrom(ctx: CommandContext, dir: string, path: string, contents: string | undefined): Promise<void> {
  const fs = gitFs(ctx.fs)
  if (contents === undefined) {
    await git.remove({ fs, dir, filepath: path })
    return
  }
  const oid = await git.writeBlob({ fs, dir, blob: new TextEncoder().encode(contents) })
  await git.updateIndex({ fs, dir, filepath: path, oid, add: true })
}

async function restoreFromSource(
  ctx: CommandContext,
  dir: string,
  source: ReadonlyMap<string, string>,
  paths: readonly string[],
  targets: SourceTargets,
): Promise<void> {
  for (const path of paths) {
    const contents = source.get(path)
    if (targets.index) await writeIndexFrom(ctx, dir, path, contents)
    if (targets.worktree) await placeFile(ctx, dir, path, contents)
  }
}

async function restoreSide(ctx: CommandContext, dir: string, paths: readonly string[], stage: number): Promise<void> {
  const unmerged = await readUnmergedStages(ctx, dir)
  const settled = paths.filter((path) => !unmerged.has(path))
  await restoreWorkdirEntries(ctx, dir, settled)

  for (const path of paths.filter((candidate) => unmerged.has(candidate))) {
    const oid = unmerged.get(path)?.get(stage)
    await placeFile(ctx, dir, path, oid === undefined ? undefined : await blobText(ctx, dir, oid))
  }
}

async function recreateConflict(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<void> {
  const unmerged = await readUnmergedStages(ctx, dir)
  const settled = paths.filter((path) => !unmerged.has(path))
  await restoreWorkdirEntries(ctx, dir, settled)

  for (const path of paths.filter((candidate) => unmerged.has(candidate))) {
    const stages = unmerged.get(path)
    const marked = await remainingConflictText(ctx, dir, path)
    if (!stages?.has(OURS_STAGE) || !stages.has(THEIRS_STAGE) || marked === undefined) {
      throw new SandboxError(`error: path '${path}' does not have all necessary versions`)
    }
    await placeFile(ctx, dir, path, genericConflictMarkers(marked))
  }
}

function refuseConflictOptions(line: CommandLine): void {
  const side = line.has('--ours', '--theirs')
  const merging = line.has('-m', '--merge')
  if (!side && !merging) return

  if (side && merging) {
    throw new SandboxError('fatal: git checkout: --ours/--theirs, --force and --merge are incompatible when\nchecking out of the index.')
  }
  if (line.has(...STAGED_FLAGS)) {
    throw new SandboxError(side ? "fatal: '--ours' or '--theirs' cannot be used with --staged" : "fatal: '--merge' or '--conflict' cannot be used with --staged")
  }
  if (line.value(...SOURCE_FLAGS)) {
    throw new SandboxError("fatal: '--merge', '--ours', or '--theirs' cannot be used when checking out of a tree")
  }
}

async function restoreConflictSide(line: CommandLine, ctx: CommandContext, dir: string, paths: readonly string[]): Promise<CommandOutput[]> {
  if (line.has('--ours', '--theirs')) await restoreSide(ctx, dir, paths, line.lastOf('--ours', '--theirs') === '--ours' ? OURS_STAGE : THEIRS_STAGE)
  else await recreateConflict(ctx, dir, paths)
  return silent
}

const SOURCE_FLAGS = ['--source', '-s']
const STAGED_FLAGS = ['--staged', '-S']

export const restore: GitSubcommand = {
  requiresRepo: true,
  options: {
    flags: ['--staged', '-S', '--worktree', '-W', '--ours', '--theirs', '-m', '--merge'],
    valueFlags: SOURCE_FLAGS,
  },
  run: async (line, ctx, dir) => {
    const specs = line.operands
    if (specs.length === 0) {
      throw new SandboxError('fatal: you must specify path(s) to restore')
    }
    refuseConflictOptions(line)

    const staged = line.has(...STAGED_FLAGS)
    const worktree = !staged || line.has('--worktree', '-W')
    const sourceSpec = line.value(...SOURCE_FLAGS)

    if (sourceSpec) {
      const source = await readSource(ctx, dir, sourceSpec)
      const indexed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
      const paths = matchPaths(ctx, dir, [...new Set([...source.keys(), ...indexed])], specs)
      await restoreFromSource(ctx, dir, source, paths, { index: staged, worktree })
      return silent
    }

    const paths = await resolveTrackedPaths(ctx, dir, specs, staged)
    if (line.has('--ours', '--theirs', '-m', '--merge')) return restoreConflictSide(line, ctx, dir, paths)

    if (!staged) await refuseUnmergedPaths(ctx, dir, paths)
    if (staged) await restoreIndexEntries(ctx, dir, paths)
    if (worktree) await restoreWorkdirEntries(ctx, dir, paths)

    return silent
  },
}
