import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { matchAny, repoPrefix } from '@/lib/git-sim/pathspec'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { joinPath } from '@/lib/git-sim/paths'
import { pathExists, removeTree, writeText } from '@/lib/git-sim/fileOperations'
import { readIndexFiles } from '@/lib/git-sim/treeContents'
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
  for (const path of paths) {
    const contents = index.get(path)
    const absolute = joinPath(dir, path)
    if (contents === undefined) {
      if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
      continue
    }
    await writeText(ctx.fs, absolute, contents)
  }
}

export async function resolveTrackedPaths(
  ctx: CommandContext,
  dir: string,
  specs: readonly string[],
): Promise<string[]> {
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  const prefix = repoPrefix(ctx, dir)

  const resolved = new Set<string>()
  for (const spec of specs) {
    const matches = matchAny([spec], prefix)
    const hits = tracked.filter(matches)
    if (hits.length === 0) {
      throw new SandboxError(`error: pathspec '${spec}' did not match any file(s) known to git`)
    }
    for (const hit of hits) resolved.add(hit)
  }
  return [...resolved]
}

export const restore: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const specs = operandsOf(args)
    if (specs.length === 0) {
      throw new SandboxError('fatal: you must specify path(s) to restore')
    }

    const paths = await resolveTrackedPaths(ctx, dir, specs)
    const staged = hasFlag(args, '--staged', '--cached')

    if (staged) await restoreIndexEntries(ctx, dir, paths)
    if (!staged || hasFlag(args, '--worktree', '-W')) {
      await restoreWorkdirEntries(ctx, dir, paths)
    }

    return silent
  },
}
