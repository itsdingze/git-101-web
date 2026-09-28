import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { readHeadHistory, type HeadMove } from '@/lib/git-sim/headHistory'
import { currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

function formatMove(move: HeadMove, index: number): string {
  return `${shortOid(move.oid)} HEAD@{${index}}: ${move.description}`
}

async function requireCommits(ctx: CommandContext, dir: string): Promise<void> {
  if (await headOid(ctx, dir)) return

  const branch = (await currentBranch(ctx, dir)) ?? 'main'
  throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
}

export const reflog: GitSubcommand = {
  requiresRepo: true,
  run: async (_args, ctx, dir) => {
    await requireCommits(ctx, dir)

    const moves = (await readHeadHistory(ctx, dir)).reverse()
    if (moves.length === 0) return silent

    return say(moves.map(formatMove).join('\n'))
  },
}
