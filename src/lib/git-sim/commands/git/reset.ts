import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { currentBranch, shortOid } from '@/lib/git-sim/repository'
import { resolveCommitish } from '@/lib/git-sim/resolveCommitish'
import { readWorkingTree } from '@/lib/git-sim/workingTree'
import { resolveTrackedPaths, restoreIndexEntries } from './restore'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

type ResetMode = 'soft' | 'mixed' | 'hard'

function modeOf(args: readonly string[]): ResetMode {
  if (hasFlag(args, '--soft')) return 'soft'
  if (hasFlag(args, '--hard')) return 'hard'
  return 'mixed'
}

async function unstagedSummary(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const tree = await readWorkingTree(ctx, dir)
  if (tree.unstaged.length === 0) return silent

  const rows = tree.unstaged.map((change) => `${change.kind === 'deleted' ? 'D' : 'M'}\t${change.path}`)
  return say(['Unstaged changes after reset:', ...rows].join('\n'))
}

async function moveBranch(
  ctx: CommandContext,
  dir: string,
  target: string,
  mode: ResetMode,
): Promise<CommandOutput[]> {
  const branch = await currentBranch(ctx, dir)
  if (!branch) throw new SandboxError('fatal: cannot reset with a detached HEAD in this course.')

  const trackedBefore = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  await git.writeRef({
    fs: gitFs(ctx.fs),
    dir,
    ref: `refs/heads/${branch}`,
    value: target,
    force: true,
  })

  if (mode === 'soft') return silent

  if (mode === 'hard') {
    await git.checkout({ fs: gitFs(ctx.fs), dir, ref: branch, force: true })
    const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: target })
    return say(`HEAD is now at ${shortOid(target)} ${commit.message.split('\n')[0]?.trim() ?? ''}`)
  }

  const trackedAfter = await git.listFiles({ fs: gitFs(ctx.fs), dir, ref: target })
  for (const path of new Set([...trackedBefore, ...trackedAfter])) {
    await git.resetIndex({ fs: gitFs(ctx.fs), dir, filepath: path })
  }
  return unstagedSummary(ctx, dir)
}

export const reset: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const mode = modeOf(args)
    const operands = operandsOf(args)
    const [first, ...rest] = operands

    if (rest.length > 0) {
      await restoreIndexEntries(ctx, dir, await resolveTrackedPaths(ctx, dir, rest))
      return unstagedSummary(ctx, dir)
    }

    const target = await resolveCommitish(ctx, dir, first ?? 'HEAD')
    if (target) return moveBranch(ctx, dir, target, mode)

    if (!first) throw new SandboxError("fatal: ambiguous argument 'HEAD': unknown revision")

    await restoreIndexEntries(ctx, dir, await resolveTrackedPaths(ctx, dir, [first]))
    return unstagedSummary(ctx, dir)
  },
}
