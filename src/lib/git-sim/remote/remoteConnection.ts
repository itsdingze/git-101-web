import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandContext, RemoteLink } from '@/lib/git-sim/types'

const HTTP_URL = /^https?:\/\//

export function unreachableRepository(url: string): string {
  if (HTTP_URL.test(url)) {
    const slashed = url.endsWith('/') ? url : `${url}/`
    return ['remote: Repository not found.', `fatal: repository '${slashed}' not found`].join('\n')
  }

  return [
    `fatal: '${url}' does not appear to be a git repository`,
    'fatal: Could not read from remote repository.',
    '',
    'Please make sure you have the correct access rights',
    'and the repository exists.',
  ].join('\n')
}

export function hostedRemoteAt(ctx: CommandContext, url: string): RemoteLink | null {
  return ctx.remote?.url === url ? ctx.remote : null
}

async function configuredUrl(ctx: CommandContext, dir: string, name: string): Promise<string> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.find((entry) => entry.remote === name)?.url ?? name
}

export async function connectToRemote(
  ctx: CommandContext,
  dir: string,
  name: string,
): Promise<RemoteLink> {
  const url = await configuredUrl(ctx, dir, name)
  const hosted = hostedRemoteAt(ctx, url)
  if (!hosted) throw new SandboxError(unreachableRepository(url))
  return { name, url, dir: hosted.dir }
}
