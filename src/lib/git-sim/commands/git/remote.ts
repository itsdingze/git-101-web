import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { createRemoteRepo } from '@/lib/git-sim/remote/remoteTransfer'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

async function listRemotes(
  ctx: CommandContext,
  dir: string,
  verbose: boolean,
): Promise<CommandOutput[]> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  if (remotes.length === 0) return silent

  if (!verbose) return say(remotes.map((entry) => entry.remote).join('\n'))

  return say(
    remotes
      .flatMap((entry) => [`${entry.remote}\t${entry.url} (fetch)`, `${entry.remote}\t${entry.url} (push)`])
      .join('\n'),
  )
}

const SET_URL_USAGE = [
  'usage: git remote set-url [--push] <name> <newurl> [<oldurl>]',
  '   or: git remote set-url --add <name> <newurl>',
  '   or: git remote set-url --delete <name> <url>',
].join('\n')

async function remoteExists(ctx: CommandContext, dir: string, name: string): Promise<boolean> {
  const remotes = await git.listRemotes({ fs: gitFs(ctx.fs), dir })
  return remotes.some((entry) => entry.remote === name)
}

export const remote: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const [action, name, url] = operandsOf(args)

    if (!action) return listRemotes(ctx, dir, args.includes('-v') || args.includes('--verbose'))

    if (action === 'add') {
      if (!name || !url) throw new SandboxError('usage: git remote add <name> <url>')
      if (await remoteExists(ctx, dir, name)) throw new SandboxError(`error: remote ${name} already exists.`)
      await git.addRemote({ fs: gitFs(ctx.fs), dir, remote: name, url })
      if (!ctx.remote) ctx.remote = { name, url, dir: await createRemoteRepo(ctx, name) }
      return silent
    }

    if (action === 'set-url') {
      if (!name || !url) throw new SandboxError(SET_URL_USAGE)
      if (!(await remoteExists(ctx, dir, name))) throw new SandboxError(`error: No such remote '${name}'`)
      await git.addRemote({ fs: gitFs(ctx.fs), dir, remote: name, url, force: true })
      return silent
    }

    if (action === 'remove' || action === 'rm') {
      if (!name) throw new SandboxError('usage: git remote remove <name>')
      if (!(await remoteExists(ctx, dir, name))) throw new SandboxError(`error: No such remote: '${name}'`)
      await git.deleteRemote({ fs: gitFs(ctx.fs), dir, remote: name })
      return silent
    }

    if (action === 'show') return listRemotes(ctx, dir, true)

    throw new SandboxError(`error: Unknown subcommand: ${action}`)
  },
}
