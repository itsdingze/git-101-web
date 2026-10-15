import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { commitSubject } from './commitSubject'
import { formatGitDate } from './formatDate'
import { currentBranch, shortOid } from './repository'
import { compareTrees, formatModeChanges, formatShortStat } from '@/lib/git-sim/diff/diffStat'
import type { CommandContext } from '@/lib/git-sim/types'

type RecordedCommit = {
  oid: string
  before: ReadonlyMap<string, string>
  after: ReadonlyMap<string, string>
  rootCommit: boolean
  showAuthorDate: boolean
}

export async function formatCommitSummary(
  ctx: CommandContext,
  dir: string,
  recorded: RecordedCommit,
): Promise<string> {
  const branch = (await currentBranch(ctx, dir)) ?? 'HEAD'
  const { commit } = await git.readCommit({ fs: gitFs(ctx.fs), dir, oid: recorded.oid })
  const deltas = compareTrees(recorded.before, recorded.after)
  const marker = recorded.rootCommit ? ' (root-commit)' : ''

  return [
    `[${branch}${marker} ${shortOid(recorded.oid)}] ${commitSubject(commit.message)}`,
    ...(recorded.showAuthorDate
      ? [` Date: ${formatGitDate(commit.author.timestamp, commit.author.timezoneOffset)}`]
      : []),
    formatShortStat(deltas),
    ...formatModeChanges(deltas),
  ].join('\n')
}
