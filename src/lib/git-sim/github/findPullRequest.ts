import { SandboxError } from '@/lib/git-sim/errors'
import type { PullRequest } from './githubState'
import type { CommandContext } from '@/lib/git-sim/types'

const NUMBER = /^#?(\d+)$/

function byNumber(ctx: CommandContext, number: number): PullRequest {
  const pull = ctx.github.pullRequests.find((candidate) => candidate.number === number)
  if (!pull) {
    throw new SandboxError(
      `GraphQL: Could not resolve to a PullRequest with the number of ${number}. (repository.pullRequest)`,
    )
  }
  return pull
}

function byBranch(ctx: CommandContext, branch: string): PullRequest {
  const forBranch = ctx.github.pullRequests.filter((candidate) => candidate.head === branch)
  const pull = forBranch.find((candidate) => candidate.state === 'OPEN') ?? forBranch[forBranch.length - 1]
  if (!pull) throw new SandboxError(`no pull requests found for branch "${branch}"`)
  return pull
}

export function findPullRequest(ctx: CommandContext, selector: string): PullRequest {
  const number = NUMBER.exec(selector)?.[1]
  return number ? byNumber(ctx, Number(number)) : byBranch(ctx, selector)
}
