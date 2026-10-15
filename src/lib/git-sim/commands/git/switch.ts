import { flagValue, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { refuseSwitchWhileMerging } from '@/lib/git-sim/merge/mergeGuards'
import { createAndSwitch, switchTo } from '@/lib/git-sim/branch/switchBranch'
import type { GitSubcommand } from '@/lib/git-sim/types'

const CREATE_FLAGS = ['-c', '--create', '-C']

export const switchCommand: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    await refuseSwitchWhileMerging(ctx, dir)
    const created = flagValue(args, ...CREATE_FLAGS)
    if (created) return createAndSwitch(ctx, dir, created, operandsOf(args, CREATE_FLAGS)[0])

    const target = operandsOf(args)[0] ?? (args.includes('-') ? '-' : undefined)
    if (!target) throw new SandboxError('fatal: missing branch or commit argument')

    return switchTo(ctx, dir, target)
  },
}
