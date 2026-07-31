import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { createRemoteRepo } from '@/lib/git-sim/remoteTransfer'
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

export const remote: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const [action, name, url] = operandsOf(args)

    if (!action) return listRemotes(ctx, dir, args.includes('-v') || args.includes('--verbose'))

    if (action === 'add') {
      if (!name || !url) throw new SandboxError('usage: git remote add <name> <url>')
      await git.addRemote({ fs: gitFs(ctx.fs), dir, remote: name, url })
      await createRemoteRepo(ctx, name)
      return silent
    }

    if (action === 'remove' || action === 'rm') {
      if (!name) throw new SandboxError('usage: git remote remove <name>')
      await git.deleteRemote({ fs: gitFs(ctx.fs), dir, remote: name })
      return silent
    }

    if (action === '-v' || action === 'show') return listRemotes(ctx, dir, true)

    throw new SandboxError(`error: Unknown subcommand: ${action}`)
  },
}
