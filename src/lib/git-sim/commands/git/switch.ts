import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { stdout } from '@/lib/git-sim/output'
import { refuseSwitchWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { createAndSwitch, switchTo } from '@/lib/git-sim/branch/switchBranch'
import { currentBranch, refOid } from '@/lib/git-sim/history/repository'
import { describeUpstreamState } from '@/lib/git-sim/remote/branchTracking'
import { remoteRefOf, uniqueRemoteBranch, type Upstream } from '@/lib/git-sim/remote/upstream'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const CREATE_FLAGS = ['-c', '--create']

async function trackingReport(ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  const branch = await currentBranch(ctx, dir)
  const upstreamState = branch ? await describeUpstreamState(ctx, dir, branch) : null
  return upstreamState ? [stdout(upstreamState)] : []
}

async function switchBranch(line: CommandLine, ctx: CommandContext, dir: string): Promise<CommandOutput[]> {
  await refuseSwitchWhileMerging(ctx, dir)
  if (line.operands.length > 1) throw new SandboxError('fatal: only one reference expected')

  const created = line.value(...CREATE_FLAGS)
  if (created) return createAndSwitch(ctx, dir, created, line.operands[0])

  const target = line.operands[0]
  if (!target) throw new SandboxError('fatal: missing branch or commit argument')

  const remoteOnly = await remoteOnlyBranch(ctx, dir, target)
  if (remoteOnly) return createAndSwitch(ctx, dir, target, remoteRefOf(remoteOnly))

  return [...(await switchTo(ctx, dir, target)), ...(await trackingReport(ctx, dir))]
}

async function remoteOnlyBranch(ctx: CommandContext, dir: string, target: string): Promise<Upstream | null> {
  if (target === '-' || (await refOid(ctx, dir, `refs/heads/${target}`))) return null
  return uniqueRemoteBranch(ctx, dir, target)
}

export const switchCommand: GitSubcommand = {
  requiresRepo: true,
  options: { flags: ['-q', '--quiet'], valueFlags: CREATE_FLAGS },
  run: async (line, ctx, dir) => {
    const outputs = await switchBranch(line, ctx, dir)
    return line.has('-q', '--quiet') ? outputs.filter((output) => output.stream === 'stderr') : outputs
  },
}
