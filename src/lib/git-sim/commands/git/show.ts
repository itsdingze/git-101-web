import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { say } from '@/lib/git-sim/output'
import { formatFileDiff } from '@/lib/git-sim/diff/unifiedDiff'
import { readCommitFiles } from '@/lib/git-sim/working-tree/treeContents'
import { currentBranch, headOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readDecorations } from './decorations'
import { fullCommitLines } from './log'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

async function requireCommit(ctx: CommandContext, dir: string, spec: string): Promise<ReadCommitResult> {
  if (!(await headOid(ctx, dir))) {
    const branch = (await currentBranch(ctx, dir)) ?? 'main'
    throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
  }

  const oid = await resolveCommitish(ctx, dir, spec)
  if (!oid) {
    throw new SandboxError(
      `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
    )
  }
  return git.readCommit({ fs: gitFs(ctx.fs), dir, oid })
}

async function changedFileDiffs(ctx: CommandContext, dir: string, entry: ReadCommitResult): Promise<string[]> {
  const [parent, mergedParent] = entry.commit.parent
  if (mergedParent) return []

  const before = parent ? await readCommitFiles(ctx, dir, parent) : new Map<string, string>()
  const after = await readCommitFiles(ctx, dir, entry.oid)

  const diffs: string[] = []
  for (const path of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const diff = await formatFileDiff(ctx, path, before.get(path), after.get(path))
    if (diff) diffs.push(diff)
  }
  return diffs
}

export const show: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const entry = await requireCommit(ctx, dir, operandsOf(args)[0] ?? 'HEAD')

    return say(
      [
        ...fullCommitLines(entry, await readDecorations(ctx, dir)),
        ...(await changedFileDiffs(ctx, dir, entry)),
      ]
        .join('\n')
        .trimEnd(),
    )
  },
}
