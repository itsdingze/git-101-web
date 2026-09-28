import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { matchAny, repoPrefix } from '@/lib/git-sim/fs/pathspec'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { placeFile } from '@/lib/git-sim/fs/pathBlockers'
import { readCommitFiles, readIndexFiles } from '@/lib/git-sim/working-tree/treeContents'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readUnmergedEntries } from '@/lib/git-sim/working-tree/indexStages'
import { headOid } from '@/lib/git-sim/history/repository'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

export async function restoreIndexEntries(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<void> {
  for (const path of paths) {
    await git.resetIndex({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
}

export async function restoreWorkdirEntries(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
): Promise<void> {
  const index = await readIndexFiles(ctx, dir)
  for (const path of paths) await placeFile(ctx, dir, path, index.get(path))
}

export async function refuseUnmergedPaths(ctx: CommandContext, dir: string, paths: readonly string[]): Promise<void> {
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

export async function resolveTrackedPaths(
  ctx: CommandContext,
  dir: string,
  specs: readonly string[],
  includeCommitted = false,
): Promise<string[]> {
  const indexed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const tracked = includeCommitted ? [...new Set([...indexed, ...(await committedPaths(ctx, dir))])] : indexed
  return matchPaths(ctx, dir, tracked, specs)
}

export async function readSource(ctx: CommandContext, dir: string, spec: string): Promise<Map<string, string>> {
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

export async function restoreFromSource(
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

export async function checkoutFromSource(
  ctx: CommandContext,
  dir: string,
  spec: string,
  specs: readonly string[],
): Promise<void> {
  const source = await readSource(ctx, dir, spec)
  const paths = matchPaths(ctx, dir, [...source.keys()], specs)
  await refuseUnmergedPaths(ctx, dir, paths)
  await restoreFromSource(ctx, dir, source, paths, { index: true, worktree: true })
}

const SOURCE_FLAGS = ['--source', '-s']

export const restore: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const specs = operandsOf(args, SOURCE_FLAGS)
    if (specs.length === 0) {
      throw new SandboxError('fatal: you must specify path(s) to restore')
    }

    const staged = hasFlag(args, '--staged', '--cached')
    const worktree = !staged || hasFlag(args, '--worktree', '-W')
    const sourceSpec = flagValue(args, ...SOURCE_FLAGS)

    if (sourceSpec) {
      const source = await readSource(ctx, dir, sourceSpec)
      const indexed = await git.listFiles({ fs: gitFs(ctx.fs), dir })
      const paths = matchPaths(ctx, dir, [...new Set([...source.keys(), ...indexed])], specs)
      if (worktree) await refuseUnmergedPaths(ctx, dir, paths)
      await restoreFromSource(ctx, dir, source, paths, { index: staged, worktree })
      return silent
    }

    const paths = await resolveTrackedPaths(ctx, dir, specs, staged)
    if (worktree) await refuseUnmergedPaths(ctx, dir, paths)
    if (staged) await restoreIndexEntries(ctx, dir, paths)
    if (worktree) await restoreWorkdirEntries(ctx, dir, paths)

    return silent
  },
}
