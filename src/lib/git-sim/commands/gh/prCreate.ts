import { SandboxError } from '@/lib/git-sim/errors'
import { flagValue, hasFlag } from '@/lib/git-sim/input/parseArgs'
import { say } from '@/lib/git-sim/output'
import { currentBranch, refOid, requireRepoDir } from '@/lib/git-sim/history/repository'
import { commitSubject } from '@/lib/git-sim/history/commitSubject'
import { compareBranches } from '@/lib/git-sim/github/branchComparison'
import { hostedBaseFor, type HostedBase } from '@/lib/git-sim/github/hostedBase'
import { pullRequestAddress } from '@/lib/git-sim/github/hostedRepository'
import { PRACTICE_ACCOUNT, TEAMMATE_LOGIN, type PullRequest } from '@/lib/git-sim/github/githubState'
import type { CommandContext, GhCommandHandler } from '@/lib/git-sim/types'

const TITLE_FLAGS = ['--title', '-t']
const BODY_FLAGS = ['--body', '-b']
const FILL_FLAGS = ['--fill', '-f']

const MISSING_TITLE_OR_BODY =
  'must provide `--title` and `--body` (or `--fill` or `fill-first` or `--fillverbose`) when not running interactively'

const NOT_PUSHED = 'aborted: you must first push the current branch to a remote, or use the --head flag'

type Description = { title: string; body: string }

function filledDescription(branch: string, messages: readonly string[]): Description {
  const [only] = messages
  if (messages.length === 1 && only !== undefined) {
    return { title: commitSubject(only), body: only.split('\n').slice(2).join('\n').trim() }
  }
  return {
    title: branch.replace(/[-_]/g, ' '),
    body: messages.map((message) => `- **${commitSubject(message)}**`).join('\n'),
  }
}

function descriptionFrom(args: readonly string[], branch: string, messages: readonly string[]): Description {
  const filled = hasFlag(args, ...FILL_FLAGS) ? filledDescription(branch, messages) : null
  const title = flagValue(args, ...TITLE_FLAGS) ?? filled?.title
  const body = flagValue(args, ...BODY_FLAGS) ?? filled?.body
  if (title === undefined || body === undefined) throw new SandboxError(MISSING_TITLE_OR_BODY)
  return { title, body }
}

function requireDescription(args: readonly string[]): void {
  const described = flagValue(args, ...TITLE_FLAGS) !== undefined && flagValue(args, ...BODY_FLAGS) !== undefined
  if (!described && !hasFlag(args, ...FILL_FLAGS)) throw new SandboxError(MISSING_TITLE_OR_BODY)
}

async function requirePushed(ctx: CommandContext, dir: string, hosted: HostedBase, branch: string): Promise<void> {
  const local = await refOid(ctx, dir, `refs/heads/${branch}`)
  const onGitHub = await refOid(ctx, hosted.dir, `refs/heads/${branch}`)
  if (!onGitHub || onGitHub !== local) throw new SandboxError(NOT_PUSHED)
}

function refuseDuplicate(ctx: CommandContext, hosted: HostedBase, branch: string, base: string): void {
  const open = ctx.github.pullRequests.find((pull) => pull.head === branch && pull.state === 'OPEN')
  if (!open) return
  throw new SandboxError(
    `a pull request for branch "${branch}" into branch "${base}" already exists:\n${pullRequestAddress(hosted.fullName, open.number)}`,
  )
}

function noCommitsBetween(base: string, branch: string): SandboxError {
  return new SandboxError(`GraphQL: No commits between ${base} and ${branch} (createPullRequest)`)
}

async function openPullRequest(
  ctx: CommandContext,
  args: readonly string[],
  hosted: HostedBase,
  refs: { head: string; base: string },
): Promise<PullRequest> {
  const comparison = await compareBranches(ctx, hosted.dir, refs.base, refs.head)
  if (comparison.messages.length === 0) throw noCommitsBetween(refs.base, refs.head)

  const pull: PullRequest = {
    ...descriptionFrom(args, refs.head, comparison.messages),
    ...refs,
    number: ctx.github.pullRequests.length + 1,
    author: ctx.github.account ?? PRACTICE_ACCOUNT,
    state: 'OPEN',
    approvedBy: ctx.github.teammateApproves ? TEAMMATE_LOGIN : null,
    commits: comparison.messages.length,
    additions: comparison.additions,
    deletions: comparison.deletions,
  }
  ctx.github.pullRequests.push(pull)
  return pull
}

export const prCreate: GhCommandHandler = async (args, ctx) => {
  requireDescription(args)
  const dir = await requireRepoDir(ctx)
  const hosted = await hostedBaseFor(ctx, dir)
  const head = (await currentBranch(ctx, dir)) ?? 'HEAD'
  const base = flagValue(args, '--base', '-B') ?? 'main'

  if (head === base) throw noCommitsBetween(base, head)
  refuseDuplicate(ctx, hosted, head, base)
  await requirePushed(ctx, dir, hosted, head)

  const pull = await openPullRequest(ctx, args, hosted, { head, base })
  return say(
    [
      `Creating pull request for ${head} into ${base} in ${hosted.fullName}`,
      '',
      pullRequestAddress(hosted.fullName, pull.number),
    ].join('\n'),
  )
}
