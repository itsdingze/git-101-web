import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import { hostedRemoteAt } from '@/lib/git-sim/remote/remoteConnection'
import { repositoryNameAt } from './hostedRepository'
import type { CommandContext } from '@/lib/git-sim/types'

export type HostedBase = {
  fullName: string
  remoteName: string
  dir: string
}

const NO_GITHUB_REMOTE =
  'none of the git remotes configured for this repository point to a known GitHub host. To tell gh about a new GitHub host, please use `gh auth login`'

export async function hostedBaseFor(ctx: CommandContext, dir: string): Promise<HostedBase> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  if (remotes.length === 0) throw new SandboxError('no git remotes found')

  for (const { remote, url } of remotes) {
    const hosted = hostedRemoteAt(ctx, url)
    const fullName = repositoryNameAt(url)
    if (hosted && fullName) return { fullName, remoteName: remote, dir: hosted.dir }
  }
  throw new SandboxError(NO_GITHUB_REMOTE)
}
