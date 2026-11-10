import { GIT_COMMANDS, UNSIMULATED_GIT_COMMANDS } from './commands/git/registry'
import { suggestCommand } from './input/suggestCommand'
import { isOwnKey } from '@/lib/isOwnKey'
import { findRepoDir, requireRepoDir } from './history/repository'
import { fail, refuse, say } from './output'
import { parseCommandLine } from './input/commandLine'
import { lockedCommand, type CommandLocks } from './input/commandLocks'
import { usageFor } from './input/gitUsage'
import type { CommandContext, CommandOutput } from './types'

const GIT_VERSION = 'git version 2.43.0'

const UNSIMULATED_NEXT_STEPS: Readonly<Record<string, string>> = {
  checkout: 'Use git switch <branch> to change branches, or git restore <file> to discard edits.',
}

function unsimulatedCommand(name: string): CommandOutput[] {
  const nextStep = isOwnKey(UNSIMULATED_NEXT_STEPS, name) ? ` ${UNSIMULATED_NEXT_STEPS[name]}` : ''
  return refuse(`git ${name} is a real Git command, but this practice sandbox doesn't simulate it.${nextStep}`)
}

function unsimulatedOption(option: string, name: string): CommandOutput[] {
  return refuse(`This practice terminal doesn't simulate ${option} for git ${name}. Check the spelling, or run the command without it.`)
}

function missingOptionValue(option: string): CommandOutput[] {
  return fail(
    option.startsWith('--')
      ? `error: option \`${option.slice(2)}' requires a value`
      : `error: switch \`${option.slice(1)}' requires a value`,
  )
}

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
  if (unlocksIn) return lockedCommand(`git ${name}`, unlocksIn, locks)

  const command = isOwnKey(GIT_COMMANDS, name) ? GIT_COMMANDS[name] : undefined
  if (!command) {
    if (UNSIMULATED_GIT_COMMANDS.includes(name)) return unsimulatedCommand(name)
    return unknownCommand(name)
  }

  const { line, unknownOption, missingValue, helpRequested } = parseCommandLine(rest, command.options)
  if (helpRequested) return refuse(`This practice terminal doesn't show manual pages for git ${name}. Run git help to see the commands it simulates.`)
  if (unknownOption) return unsimulatedOption(unknownOption, name)
  if (missingValue) return missingOptionValue(missingValue)

  const dir = command.requiresRepo
    ? await requireRepoDir(ctx)
    : ((await findRepoDir(ctx)) ?? ctx.cwd)

  return command.run(line, ctx, dir)
}
