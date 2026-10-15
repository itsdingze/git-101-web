import { parseLine, type Redirection } from './input/tokenize'
import { runGit } from './runGit'
import { runGh } from './runGh'
import { SHELL_COMMANDS } from './commands/shell/registry'
import { isOwnKey } from '@/lib/isOwnKey'
import { CourseExplanationError, describeGitError } from './errors'
import { resolvePath } from './fs/paths'
import {
  isDirectory,
  parentFolderProblem,
  pathExists,
  readText,
  writeText,
} from './fs/fileOperations'
import { fail, refuse } from './output'
import { hasBackslash, LINE_CONTINUES, NO_BACKSLASH_NAMES } from './input/backslashNames'
import { NO_LOCKS, type CommandLocks } from './input/commandLocks'
import { outputRedirectionRefusal, shellCommandRefusal, type ShellAccess } from './input/shellAccess'
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

async function readInput(ctx: CommandContext, input: string): Promise<string | null> {
  const path = resolvePath(input, ctx.cwd, ctx.root)
  if (!(await pathExists(ctx.fs, path)) || (await isDirectory(ctx.fs, path))) return null
  return readText(ctx.fs, path)
}

async function dispatch(
  name: string,
  args: readonly string[],
  ctx: CommandContext,
  locks: CommandLocks,
  stdin: string,
): Promise<CommandOutput[]> {
  if (name === 'git') return runGit(args, ctx, locks)
  if (name === 'gh') return runGh(args, ctx, locks, stdin)

  const shell = isOwnKey(SHELL_COMMANDS, name) ? SHELL_COMMANDS[name] : undefined
  if (shell) return shell(args, ctx, locks)

  return fail(`bash: ${name}: command not found`)
}

function accessRefusal(
  name: string,
  redirection: Redirection | null,
  access: ShellAccess,
  locks: CommandLocks,
): CommandOutput[] | null {
  const shellRefusal = isOwnKey(SHELL_COMMANDS, name) ? shellCommandRefusal(name, access, locks) : null
  return shellRefusal ?? (redirection ? outputRedirectionRefusal(access, locks) : null)
}

function errorOutputs(error: unknown): CommandOutput[] {
  if (error instanceof CourseExplanationError) return refuse(error.message)
  return fail(describeGitError(error))
}

export async function runCommand(
  line: string,
  ctx: CommandContext,
  locks: CommandLocks = NO_LOCKS,
  access: ShellAccess = 'full',
): Promise<RunResult> {
  const { tokens, redirection, input, redirectionMissingTarget, continuesLine } = parseLine(line)
  const [name, ...args] = tokens

  if (continuesLine) return { outputs: refuse(LINE_CONTINUES), clearScreen: false }
  if (redirectionMissingTarget) {
    return { outputs: fail("bash: syntax error near unexpected token `newline'"), clearScreen: false }
  }
  if (!name) return { outputs: [], clearScreen: false }
  if (name === 'clear') return { outputs: [], clearScreen: true }

  const refusal = accessRefusal(name, redirection, access, locks)
  if (refusal) return { outputs: refusal, clearScreen: false }

  try {
    const stdin = input === null ? '' : await readInput(ctx, input)
    if (stdin === null) return { outputs: fail(`bash: ${input}: No such file or directory`), clearScreen: false }

    const problem = redirection ? await redirectionProblem(ctx, redirection) : null
    if (problem) return { outputs: fail(problem), clearScreen: false }

    const outputs = await dispatch(name, args, ctx, locks, stdin)
    return {
      outputs: redirection ? await redirect(ctx, outputs, redirection) : outputs,
      clearScreen: false,
    }
  } catch (error) {
    return { outputs: errorOutputs(error), clearScreen: false }
  }
}
