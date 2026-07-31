import { GIT_COMMANDS, UNSIMULATED_GIT_COMMANDS } from './commands/git/registry'
import { suggestCommand } from './suggestCommand'
import { findRepoDir, requireRepoDir } from './repository'
import { fail, say } from './output'
import type { CommandContext, CommandOutput } from './types'

const GIT_VERSION = 'git version 2.43.0'

const USAGE = [
  'usage: git [-v | --version] [-h | --help] <command> [<args>]',
  '',
  'These are the Git commands this practice sandbox understands:',
  '',
  '   start a working area',
  '      init       create an empty Git repository',
  '      config     set your name, email, or editor',
  '',
  '   work on the current change',
  '      add        add file contents to the staging area',
  '      restore    restore working tree files',
  '      reset      reset current HEAD to another state',
  '      rm         remove files from the working tree and the index',
  '',
  '   examine the history and state',
  '      status     show the working tree status',
  '      diff       show changes between commits, commit and working tree, etc',
  '      log        show commit logs',
  '',
  '   grow, mark and tweak your common history',
  '      branch     list, create, or delete branches',
  '      switch     switch branches',
  '      checkout   switch branches or restore working tree files',
  '      commit     record changes to the repository',
  '      merge      join two or more development histories together',
  '',
  '   collaborate',
  '      remote     manage set of tracked repositories',
  '      fetch      download objects and refs from another repository',
  '      pull       fetch from and integrate with another repository',
  '      push       update remote refs along with associated objects',
].join('\n')

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
): Promise<CommandOutput[]> {
  const [name, ...rest] = args

  if (!name || name === 'help' || name === '--help' || name === '-h') return say(USAGE)
  if (name === '--version' || name === 'version') return say(GIT_VERSION)

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
