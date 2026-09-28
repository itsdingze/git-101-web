import { parseLine, type Redirection } from './input/tokenize'
import { runGit } from './runGit'
import { SHELL_COMMANDS } from './commands/shell/registry'
import { describeGitError } from './errors'
import { resolvePath } from './fs/paths'
import {
  isDirectory,
  parentFolderProblem,
  pathExists,
  readText,
  writeText,
} from './fs/fileOperations'
import { fail } from './output'
import { hasBackslash, LINE_CONTINUES, NO_BACKSLASH_NAMES } from './input/backslashNames'
import { NO_LOCKS, type CommandLocks } from './input/commandLocks'
import type { CommandContext, CommandOutput } from './types'

export type RunResult = {
  outputs: CommandOutput[]
  clearScreen: boolean
}

async function redirectionProblem(
  ctx: CommandContext,
  redirection: Redirection,
): Promise<string | null> {
  if (redirection.target === '') return 'bash: : No such file or directory'
  if (hasBackslash(redirection.target)) return NO_BACKSLASH_NAMES

  const path = resolvePath(redirection.target, ctx.cwd, ctx.root)
  if (await isDirectory(ctx.fs, path)) return `bash: ${redirection.target}: Is a directory`

  const problem = await parentFolderProblem(ctx.fs, path, false)
  return problem ? `bash: ${redirection.target}: ${problem}` : null
}

async function redirect(
  ctx: CommandContext,
  outputs: readonly CommandOutput[],
  redirection: Redirection,
): Promise<CommandOutput[]> {
  const path = resolvePath(redirection.target, ctx.cwd, ctx.root)
  const captured = outputs
    .filter((output) => output.stream === 'stdout')
    .map((output) => output.text)
    .join('\n')

  const existing =
    redirection.append && (await pathExists(ctx.fs, path)) ? await readText(ctx.fs, path) : ''
  await writeText(ctx.fs, path, `${existing}${captured}\n`)

  return outputs.filter((output) => output.stream === 'stderr')
}

async function dispatch(
  name: string,
  args: readonly string[],
  ctx: CommandContext,
  locks: CommandLocks,
): Promise<CommandOutput[]> {
  if (name === 'git') return runGit(args, ctx, locks)

  const shell = SHELL_COMMANDS[name]
  if (shell) return shell(args, ctx, locks)

  return [{ text: `bash: ${name}: command not found`, stream: 'stderr' }]
}

export async function runCommand(
  line: string,
  ctx: CommandContext,
  locks: CommandLocks = NO_LOCKS,
): Promise<RunResult> {
  const { tokens, redirection, redirectionMissingTarget, continuesLine } = parseLine(line)
  const [name, ...args] = tokens

  if (continuesLine) return { outputs: fail(LINE_CONTINUES), clearScreen: false }
  if (redirectionMissingTarget) {
    return { outputs: fail("bash: syntax error near unexpected token `newline'"), clearScreen: false }
  }
  if (!name) return { outputs: [], clearScreen: false }
  if (name === 'clear') return { outputs: [], clearScreen: true }

  try {
    const problem = redirection ? await redirectionProblem(ctx, redirection) : null
    if (problem) return { outputs: fail(problem), clearScreen: false }

    const outputs = await dispatch(name, args, ctx, locks)
    return {
      outputs: redirection ? await redirect(ctx, outputs, redirection) : outputs,
      clearScreen: false,
    }
  } catch (error) {
    return { outputs: [{ text: describeGitError(error), stream: 'stderr' }], clearScreen: false }
  }
}
