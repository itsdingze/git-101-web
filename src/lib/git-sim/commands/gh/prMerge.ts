import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { branch as gitBranch } from '@/lib/git-sim/commands/git/branch'
import { pull as gitPull } from '@/lib/git-sim/commands/git/pull'
import { switchTo } from '@/lib/git-sim/branch/switchBranch'
import { fail, refuse, say, stdout } from '@/lib/git-sim/output'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { currentBranch, refOid, requireRepoDir, resolveIdentity } from '@/lib/git-sim/history/repository'
import { hostedBaseFor, type HostedBase } from '@/lib/git-sim/github/hostedBase'
import { findPullRequest } from '@/lib/git-sim/github/findPullRequest'
import { mergeOnGitHub } from '@/lib/git-sim/github/mergeOnGitHub'
import type { PullRequest } from '@/lib/git-sim/github/githubState'
import type { CommandContext, CommandOutput, GhCommandHandler } from '@/lib/git-sim/types'

const METHOD_REQUIRED = '--merge, --rebase, or --squash required when not running interactively'
const ONLY_MERGE = 'This practice terminal only simulates --merge. Run gh pr merge --merge'

function methodRefusal(args: readonly string[]): CommandOutput[] | null {
  if (hasFlag(args, '--merge', '-m')) return null
  return hasFlag(args, '--squash', '-s', '--rebase', '-r') ? refuse(ONLY_MERGE) : fail(METHOD_REQUIRED)
}

async function deleteLocalBranch(
  ctx: CommandContext,
  dir: string,
  hosted: HostedBase,
  pull: PullRequest,
): Promise<CommandOutput[]> {
  if (!(await refOid(ctx, dir, `refs/heads/${pull.head}`))) return []

  const onHead = (await currentBranch(ctx, dir)) === pull.head
  const moved = onHead
    ? [...(await switchTo(ctx, dir, pull.base)), ...(await gitPull.run(['--ff-only', hosted.remoteName, pull.base], ctx, dir))]
    : []
  const switched = onHead ? ` and switched to branch ${pull.base}` : ''

  return [
    ...moved,
    ...(await gitBranch.run(['-D', pull.head], ctx, dir)),
    stdout(`✓ Deleted local branch ${pull.head}${switched}`),
  ]
}

async function deleteBranches(
  ctx: CommandContext,
  dir: string,
  hosted: HostedBase,
  pull: PullRequest,
): Promise<CommandOutput[]> {
  const local = await deleteLocalBranch(ctx, dir, hosted, pull)
  await git.deleteBranch({ fs: gitFs(ctx.fs), dir: hosted.dir, ref: pull.head })
  return [...local, stdout(`✓ Deleted remote branch ${pull.head}`)]
}

export const prMerge: GhCommandHandler = async (args, ctx) => {
  const refusal = methodRefusal(args)
  if (refusal) return refusal

  const dir = await requireRepoDir(ctx)
  const hosted = await hostedBaseFor(ctx, dir)
  const pull = findPullRequest(ctx, operandsOf(args)[0] ?? (await currentBranch(ctx, dir)) ?? 'HEAD')
  const label = `${hosted.fullName}#${pull.number}`
  if (pull.state === 'MERGED') return say(`! Pull request ${label} was already merged`)

  await mergeOnGitHub(ctx, hosted, pull, await resolveIdentity(ctx, dir))
  const merged = stdout(`✓ Merged pull request ${label} (${pull.title})`)
  if (!hasFlag(args, '--delete-branch', '-d')) return [merged]
  return [merged, ...(await deleteBranches(ctx, dir, hosted, pull))]
}
