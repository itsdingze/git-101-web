import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { findRepoDir } from '@/lib/git-sim/repository'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

async function listAll(ctx: CommandContext, global: boolean): Promise<CommandOutput[]> {
  const entries = [...ctx.globalConfig].map(([key, value]) => `${key}=${value}`)

  if (!global) {
    const dir = await findRepoDir(ctx)
    if (dir) {
      for (const path of ['user.name', 'user.email', 'core.editor']) {
        const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path })
        if (typeof value === 'string') entries.push(`${path}=${value}`)
      }
    }
  }

  return entries.length > 0 ? say(entries.join('\n')) : silent
}

async function readValue(
  ctx: CommandContext,
  key: string,
  global: boolean,
): Promise<CommandOutput[]> {
  if (!global) {
    const dir = await findRepoDir(ctx)
    if (dir) {
      const value: unknown = await git.getConfig({ fs: gitFs(ctx.fs), dir, path: key })
      if (typeof value === 'string') return say(value)
    }
  }

  const stored = ctx.globalConfig.get(key)
  return stored === undefined ? silent : say(stored)
}

export const config: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const global = hasFlag(args, '--global', '--system')
    const [key, value] = operandsOf(args)

    if (hasFlag(args, '--list', '-l')) return listAll(ctx, global)
    if (!key) throw new SandboxError('usage: git config [--global] <name> [<value>]')

    if (value === undefined) return readValue(ctx, key, global)

    if (global) {
      ctx.globalConfig.set(key, value)
      return silent
    }

    const dir = await findRepoDir(ctx)
    if (!dir) {
      throw new SandboxError('fatal: not in a git directory')
    }
    await git.setConfig({ fs: gitFs(ctx.fs), dir, path: key, value })
    return silent
  },
}
