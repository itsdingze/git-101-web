import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError, unknownRevision } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { pathExists } from '@/lib/git-sim/fileOperations'
import { resolvePath } from '@/lib/git-sim/paths'
import { matchAny, repoPrefix } from '@/lib/git-sim/pathspec'
import { recordHeadMove } from '@/lib/git-sim/headHistory'
import { currentBranch, shortOid } from '@/lib/git-sim/repository'
import { commitSubject } from '@/lib/git-sim/commitSubject'
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

async function namesAPath(ctx: CommandContext, dir: string, spec: string): Promise<boolean> {
  if (await pathExists(ctx.fs, resolvePath(spec, ctx.cwd, ctx.root))) return true
  const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
  return tracked.some(matchAny([spec], repoPrefix(ctx, dir)))
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
    return say(`HEAD is now at ${shortOid(target)} ${commitSubject(commit.message)}`)
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

    const spec = first ?? 'HEAD'
    const target = await resolveCommitish(ctx, dir, spec)
    if (target) {
      const outputs = await moveBranch(ctx, dir, target, mode)
      await recordHeadMove(ctx, dir, `reset: moving to ${spec}`)
      return outputs
    }

    if (!first) throw new SandboxError("fatal: ambiguous argument 'HEAD': unknown revision")
    if (!(await namesAPath(ctx, dir, first))) throw new SandboxError(unknownRevision(first))

    await restoreIndexEntries(ctx, dir, await resolveTrackedPaths(ctx, dir, [first]))
    return unstagedSummary(ctx, dir)
  },
}
