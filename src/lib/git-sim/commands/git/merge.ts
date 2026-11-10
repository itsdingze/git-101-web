import { forceCheckout } from '@/lib/git-sim/working-tree/forceCheckout'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { CourseExplanationError, SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { refOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { endMerge, readMergeInProgress } from '@/lib/git-sim/merge/mergeInProgress'
import { branchToMergeOnto, refuseMergeWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { mergeInto, type FastForwardMode } from '@/lib/git-sim/merge/mergeInto'
import { readDirtyWork, restoreDirtyWork, type DirtyWork } from '@/lib/git-sim/working-tree/dirtyWork'
import { concludeMerge } from './commit'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const NOTHING_TO_ABORT = 'fatal: There is no merge to abort (MERGE_HEAD missing).'
const MESSAGE_FLAGS = ['-m', '--message']
const FAST_FORWARD_FLAGS = ['--ff', '--no-ff', '--ff-only']
const ONE_BRANCH_AT_A_TIME = 'This practice terminal merges one branch at a time. Run git merge once for each branch.'

async function abortMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const merge = await readMergeInProgress(ctx, dir)
  if (!merge) throw new SandboxError(NOTHING_TO_ABORT)

  const ours = await branchToMergeOnto(ctx, dir)

  const work = await readDirtyWork(ctx, dir)
  const conflicted = new Set(merge.conflicted)
  const kept: DirtyWork = {
    entries: work.entries.filter((entry) => entry.staged === null && !conflicted.has(entry.path)),
    untracked: work.untracked,
  }

  await forceCheckout(ctx, dir, ours)
  await endMerge(ctx, dir)
  await restoreDirtyWork(ctx, dir, kept)
  return silent
}

async function mergeTarget(
  ctx: CommandContext,
  dir: string,
  spec: string,
): Promise<string | null> {
  if (await refOid(ctx, dir, spec)) return spec
  return resolveCommitish(ctx, dir, spec)
}

async function mergeTitle(ctx: CommandContext, dir: string, spec: string): Promise<string> {
  if (await refOid(ctx, dir, `refs/heads/${spec}`)) return `Merge branch '${spec}'`
  if (await refOid(ctx, dir, `refs/remotes/${spec}`)) return `Merge remote-tracking branch '${spec}'`
  return `Merge commit '${spec}'`
}

async function continueMerge(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  if (!(await readMergeInProgress(ctx, dir))) {
    throw new SandboxError('fatal: There is no merge in progress (MERGE_HEAD missing).')
  }
  return concludeMerge(ctx, dir)
}

export const merge: GitSubcommand = {
  requiresRepo: true,
  options: {
    flags: ['--abort', '--continue', '--quit', '--no-edit', '-q', '--quiet', '--squash', '--commit', '--no-commit', ...FAST_FORWARD_FLAGS],
    valueFlags: MESSAGE_FLAGS,
  },
  run: async (line, ctx, dir) => {
    const outputs = await runMerge(line, ctx, dir)
    return line.has('-q', '--quiet') ? outputs.filter((output) => output.stream === 'stderr') : outputs
  },
}

async function runMerge(line: CommandLine, ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  if (line.has('--abort')) return abortMerge(ctx, dir)
  if (line.has('--continue')) return continueMerge(ctx, dir)
  if (line.has('--quit')) {
    await endMerge(ctx, dir)
    return silent
  }

  await refuseMergeWhileMerging(ctx, dir, 'Merging')
  if (line.operands.length > 1) throw new CourseExplanationError(ONE_BRANCH_AT_A_TIME)
  refuseSquashCombinations(line)

  const spec = line.operands[0]
  if (!spec) {
    throw new SandboxError('fatal: No commit specified and merge.defaultToUpstream not set.')
  }

  const theirs = await mergeTarget(ctx, dir, spec)
  if (!theirs) throw new SandboxError(`merge: ${spec} - not something we can merge`)

  const title = await mergeTitle(ctx, dir, spec)
  return say(
    await mergeInto(ctx, dir, { ref: theirs, label: spec }, title, {
      message: line.values(...MESSAGE_FLAGS).join('\n\n') || undefined,
      fastForward: fastForwardModeOf(line),
      stopBeforeCommit: stopBeforeCommitOf(line),
    }),
  )
}

function refuseSquashCombinations(line: CommandLine): void {
  if (!line.has('--squash')) return
  if (line.has('--no-ff')) throw new SandboxError('fatal: You cannot combine --squash with --no-ff.')
  if (line.has('--commit')) throw new SandboxError('fatal: You cannot combine --squash with --commit.')
}

function stopBeforeCommitOf(line: CommandLine): 'squash' | 'no-commit' | undefined {
  if (line.has('--squash')) return 'squash'
  return line.lastOf('--commit', '--no-commit') === '--no-commit' ? 'no-commit' : undefined
}

function fastForwardModeOf(line: CommandLine): FastForwardMode {
  switch (line.lastOf(...FAST_FORWARD_FLAGS)) {
    case '--no-ff':
      return 'never'
    case '--ff-only':
      return 'only'
    default:
      return 'allow'
  }
}
