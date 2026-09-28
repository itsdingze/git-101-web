import { GIT_COMMANDS, UNSIMULATED_GIT_COMMANDS } from './commands/git/registry'
import { suggestCommand } from './input/suggestCommand'
import { findRepoDir, requireRepoDir } from './history/repository'
import { fail, say } from './output'
import { lockedCommand, type CommandLocks } from './input/commandLocks'
import { usageFor } from './input/gitUsage'
import type { CommandContext, CommandOutput } from './types'

const GIT_VERSION = 'git version 2.43.0'

function unknownCommand(name: string): CommandOutput[] {
  const suggestion = suggestCommand(name, [
    ...Object.keys(GIT_COMMANDS),
    ...UNSIMULATED_GIT_COMMANDS,
  ])

  return fail(
    [
      `git: '${name}' is not a git command. See 'git --help'.`,
      ...(suggestion ? ['', 'The most similar command is', `\t${suggestion}`] : []),
    ].join('\n'),
  )
}

export async function runGit(
  args: readonly string[],
  ctx: CommandContext,
  locks: CommandLocks,
): Promise<CommandOutput[]> {
  const [name, ...rest] = args

  if (!name || name === 'help' || name === '--help' || name === '-h') return say(usageFor(locks))
  if (name === '--version' || name === 'version') return say(GIT_VERSION)

  const unlocksIn = locks.get(name)
  if (unlocksIn) return lockedCommand(name, unlocksIn, locks)

  const command = GIT_COMMANDS[name]
  if (!command) {
    if (UNSIMULATED_GIT_COMMANDS.includes(name)) {
      return fail(
        `git ${name} is a real Git command, but this practice sandbox does not simulate it.`,
      )
    }
    return unknownCommand(name)
  }

  const dir = command.requiresRepo
    ? await requireRepoDir(ctx)
    : ((await findRepoDir(ctx)) ?? ctx.cwd)

  return command.run(rest, ctx, dir)
}
