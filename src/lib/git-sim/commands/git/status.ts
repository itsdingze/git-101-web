import { say } from '@/lib/git-sim/output'
import { hasFlag } from '@/lib/git-sim/input/parseArgs'
import { readIgnoredEntries } from '@/lib/git-sim/fs/ignoredPaths'
import { formatShortStatus } from '@/lib/git-sim/working-tree/shortStatus'
import { formatStatus } from '@/lib/git-sim/working-tree/longStatus'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const status: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const ignored = hasFlag(args, '--ignored') ? await readIgnoredEntries(ctx, dir) : []
    if (hasFlag(args, '-s', '--short')) return say(await formatShortStatus(ctx, dir, ignored))
    return say(await formatStatus(ctx, dir, ignored))
  },
}
