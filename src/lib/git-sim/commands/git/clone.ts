import git from 'isomorphic-git'
import { SandboxError } from '@/lib/git-sim/errors'
import { isDirectory, listEntries, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { say } from '@/lib/git-sim/output'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { basename, resolvePath } from '@/lib/git-sim/fs/paths'
import { cloneInto, countObjects } from '@/lib/git-sim/remote/remoteTransfer'
import { hostedRemoteAt, unreachableRepository } from '@/lib/git-sim/remote/remoteConnection'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandContext, GitSubcommand, RemoteLink } from '@/lib/git-sim/types'

const MISSING_REPOSITORY = [
  'fatal: You must specify a repository to clone.',
  '',
  'usage: git clone [<options>] [--] <repo> [<dir>]',
].join('\n')

function directoryNameFor(url: string): string {
  return basename(url.replace(/\/+$/, '')).replace(/\.git$/, '')
}

function remoteFor(ctx: CommandContext, url: string, name: string): RemoteLink {
  const hosted = hostedRemoteAt(ctx, url)
  if (hosted) return hosted

  throw new SandboxError([`Cloning into '${name}'...`, unreachableRepository(url)].join('\n'))
}

async function requireEmptyDestination(
  ctx: CommandContext,
  path: string,
  name: string,
): Promise<void> {
  if (!(await pathExists(ctx.fs, path))) return

  const empty = (await isDirectory(ctx.fs, path)) && (await listEntries(ctx.fs, path)).length === 0
  if (empty) return

  throw new SandboxError(
    `fatal: destination path '${name}' already exists and is not an empty directory.`,
  )
}

function transferReport(name: string, objects: number, blobs: number): string {
  return [
    `Cloning into '${name}'...`,
    `remote: Enumerating objects: ${objects}, done.`,
    `remote: Counting objects: 100% (${objects}/${objects}), done.`,
    `remote: Compressing objects: 100% (${blobs}/${blobs}), done.`,
    `remote: Total ${objects} (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)`,
    `Receiving objects: 100% (${objects}/${objects}), done.`,
  ].join('\n')
}

async function countBlobs(ctx: CommandContext, dir: string): Promise<number> {
  return (await git.listFiles({ fs: gitFs(ctx.fs), dir })).length
}

export const clone: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const [url, target] = operandsOf(args)
    if (!url) throw new SandboxError(MISSING_REPOSITORY)

    const name = target ?? directoryNameFor(url)
    const destination = resolvePath(name, ctx.cwd, ctx.root)
    await requireEmptyDestination(ctx, destination, name)

    const outcome = await cloneInto(ctx, remoteFor(ctx, url, name), destination)
    if (outcome === 'empty') {
      return say([`Cloning into '${name}'...`, 'warning: You appear to have cloned an empty repository.'].join('\n'))
    }

    const objects = await countObjects(ctx, destination)
    return say(transferReport(name, objects, await countBlobs(ctx, destination)))
  },
}
