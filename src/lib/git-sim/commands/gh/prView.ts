import { say } from '@/lib/git-sim/output'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { currentBranch, requireRepoDir } from '@/lib/git-sim/history/repository'
import { hostedBaseFor } from '@/lib/git-sim/github/hostedBase'
import { findPullRequest } from '@/lib/git-sim/github/findPullRequest'
import { pullRequestAddress } from '@/lib/git-sim/github/hostedRepository'
import type { PullRequest } from '@/lib/git-sim/github/githubState'
import type { GhCommandHandler } from '@/lib/git-sim/types'

const STATE_LABELS: Record<PullRequest['state'], string> = { OPEN: 'Open', MERGED: 'Merged' }

function commitCount(count: number): string {
  return count === 1 ? '1 commit' : `${count} commits`
}

function bodyLines(body: string): string[] {
  if (body === '') return ['  No description provided']
  return body.split('\n').map((line) => (line === '' ? '' : `  ${line}`))
}

function preview(pull: PullRequest, fullName: string): string {
  return [
    `${pull.title} ${fullName}#${pull.number}`,
    `${STATE_LABELS[pull.state]} • ${pull.author} wants to merge ${commitCount(pull.commits)} into ${pull.base} from ${pull.head} • less than a minute ago`,
    `+${pull.additions} -${pull.deletions}`,
    ...(pull.approvedBy ? [`Reviewers: ${pull.approvedBy} (Approved)`] : []),
    '',
    ...bodyLines(pull.body),
    '',
    `View this pull request on GitHub: ${pullRequestAddress(fullName, pull.number)}`,
  ].join('\n')
}

export const prView: GhCommandHandler = async (args, ctx) => {
  const dir = await requireRepoDir(ctx)
  const hosted = await hostedBaseFor(ctx, dir)
  const selector = operandsOf(args)[0] ?? (await currentBranch(ctx, dir)) ?? 'HEAD'

  return say(preview(findPullRequest(ctx, selector), hosted.fullName))
}
