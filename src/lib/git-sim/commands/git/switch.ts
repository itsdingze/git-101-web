import { flagValue, hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { stdout } from '@/lib/git-sim/output'
import { refuseSwitchWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { createAndSwitch, switchTo } from '@/lib/git-sim/branch/switchBranch'
import { currentBranch } from '@/lib/git-sim/history/repository'
import { describeTracking, readTracking } from '@/lib/git-sim/remote/branchTracking'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const CREATE_FLAGS = ['-c', '--create', '-C']

async function trackingReport(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const branch = await currentBranch(ctx, dir)
  const tracking = branch ? await readTracking(ctx, dir, branch) : null
  return tracking ? [stdout(describeTracking(tracking))] : []
}

async function switchBranch(args: readonly string[], ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  await refuseSwitchWhileMerging(ctx, dir)
  const created = flagValue(args, ...CREATE_FLAGS)
  if (created) return createAndSwitch(ctx, dir, created, operandsOf(args, CREATE_FLAGS)[0])

  const target = operandsOf(args)[0] ?? (args.includes('-') ? '-' : undefined)
  if (!target) throw new SandboxError('fatal: missing branch or commit argument')

  return [...(await switchTo(ctx, dir, target)), ...(await trackingReport(ctx, dir))]
}

export const switchCommand: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const outputs = await switchBranch(args, ctx, dir)
    return hasFlag(args, '-q', '--quiet') ? outputs.filter((output) => output.stream === 'stderr') : outputs
  },
}
