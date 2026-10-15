import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import type { HostedBase } from './hostedBase'
import type { PullRequest } from './githubState'
import type { CommandContext, UserIdentity } from '@/lib/git-sim/types'

const GITHUB_COMMITTER = { name: 'GitHub', email: 'noreply@github.com' }

function mergeMessage(hosted: HostedBase, pull: PullRequest): string {
  const [owner] = hosted.fullName.split('/')
  return `Merge pull request #${pull.number} from ${owner ?? ''}/${pull.head}\n\n${pull.title}`
}

export async function mergeOnGitHub(
  ctx: CommandContext,
  hosted: HostedBase,
  pull: PullRequest,
  merger: UserIdentity,
): Promise<void> {
  const timestamp = ctx.nextTimestamp()
  try {
    await git.merge({
      fs: gitFs(ctx.fs),
      dir: hosted.dir,
      ours: pull.base,
      theirs: pull.head,
      fastForward: false,
      abortOnConflict: true,
      message: mergeMessage(hosted, pull),
      author: { ...merger, timestamp, timezoneOffset: 0 },
      committer: { ...GITHUB_COMMITTER, timestamp, timezoneOffset: 0 },
    })
  } catch (error) {
    if (!(error instanceof git.Errors.MergeConflictError)) throw error
    throw new SandboxError(
      `X Pull request ${hosted.fullName}#${pull.number} is not mergeable: the merge commit cannot be cleanly created.`,
    )
  }
  pull.state = 'MERGED'
}
