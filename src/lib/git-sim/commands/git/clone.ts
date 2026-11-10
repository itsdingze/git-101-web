import { SandboxError } from '@/lib/git-sim/errors'
import { isDirectory, listEntries, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { say } from '@/lib/git-sim/output'
import { basename, resolvePath } from '@/lib/git-sim/fs/paths'
import { cloneInto, hasRemoteBranch } from '@/lib/git-sim/remote/remoteTransfer'
import { cloneProgressLines, listHistoryObjects, listStoredObjects, summarizePack } from '@/lib/git-sim/remote/packReport'
import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { hostedRemoteAt, unreachableRepository } from '@/lib/git-sim/remote/remoteConnection'
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

function depthOf(line: CommandLine): number | undefined {
  const value = line.value('--depth')
  if (value === undefined) return undefined
  if (!/^\d+$/.test(value) || Number(value) <= 0) throw new SandboxError(`fatal: depth ${value} is not a positive number`)
  return Number(value)
}

export const clone: GitSubcommand = {
  requiresRepo: false,
  options: { flags: [], valueFlags: ['--depth', '-b', '--branch'] },
  run: async (line, ctx) => {
    const [url, target] = line.operands
    if (!url) throw new SandboxError(MISSING_REPOSITORY)

    const depth = depthOf(line)
    const name = target ?? directoryNameFor(url)
    const destination = resolvePath(name, ctx.cwd, ctx.root)
    await requireEmptyDestination(ctx, destination, name)

    const remote = remoteFor(ctx, url, name)
    const branch = line.value('-b', '--branch')
    if (branch !== undefined && !(await hasRemoteBranch(ctx, remote, branch))) {
      throw new SandboxError([`Cloning into '${name}'...`, `fatal: Remote branch ${branch} not found in upstream ${remote.name}`].join('\n'))
    }

    const outcome = await cloneInto(ctx, remote, destination, { branch, depth })
    if (outcome === 'empty') {
      return say([`Cloning into '${name}'...`, 'warning: You appear to have cloned an empty repository.'].join('\n'))
    }

    const received = depth === undefined ? await listStoredObjects(ctx, destination) : await listHistoryObjects(ctx, destination)
    const summary = await summarizePack(ctx, destination, received, [])
    return say([`Cloning into '${name}'...`, ...cloneProgressLines(summary)].join('\n'))
  },
}
