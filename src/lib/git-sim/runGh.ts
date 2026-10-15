import { GH_COMMANDS } from './commands/gh/registry'
import { isOwnKey } from '@/lib/isOwnKey'
import { lockedCommand, type CommandLocks } from './input/commandLocks'
import { fail, say } from './output'
import type { CommandContext, CommandOutput } from './types'

const SIGN_IN_FIRST = [
  'To get started with GitHub CLI, please run:  gh auth login',
  'Alternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token.',
].join('\n')

function usage(): string {
  const lines = Object.entries(GH_COMMANDS).flatMap(([group, commands]) =>
    Object.keys(commands).map((name) => `  gh ${group} ${name}`),
  )
  return ['Work seamlessly with GitHub from the command line.', '', 'USAGE', '  gh <command> <subcommand> [flags]', '', 'COMMANDS IN THIS PRACTICE TERMINAL', ...lines].join('\n')
}

export async function runGh(
  args: readonly string[],
  ctx: CommandContext,
  locks: CommandLocks,
  stdin: string,
): Promise<CommandOutput[]> {
  const unlocksIn = locks.get('gh')
  if (unlocksIn) return lockedCommand('gh', unlocksIn, locks)

  const [group, name, ...rest] = args
  if (!group) return say(usage())

  const commands = isOwnKey(GH_COMMANDS, group) ? GH_COMMANDS[group] : undefined
  if (!commands) return fail(`unknown command "${group}" for "gh"`)

  const command = name && isOwnKey(commands, name) ? commands[name] : undefined
  if (!command) return name ? fail(`unknown command "${name}" for "gh ${group}"`) : say(usage())

  if (group !== 'auth' && !ctx.github.account) return fail(SIGN_IN_FIRST)
  return command(rest, ctx, stdin)
}
