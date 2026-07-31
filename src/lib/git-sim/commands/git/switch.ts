import { flagValue, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { createAndSwitch, switchTo } from './switchBranch'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const switchCommand: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const created = flagValue(args, '-c', '--create', '-C')
    if (created) return createAndSwitch(ctx, dir, created)

    const target = operandsOf(args)[0] ?? (args.includes('-') ? '-' : undefined)
    if (!target) throw new SandboxError('fatal: missing branch or commit argument')

    return switchTo(ctx, dir, target)
  },
}
