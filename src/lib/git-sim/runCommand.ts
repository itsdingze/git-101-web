import {
  parseCommandList,
  type Connector,
  type ListedCommand,
  type ParsedCommand,
  type Redirection,
} from './input/tokenize'
import { endsWithOperator, unsupportedSyntaxMessage } from './input/unsupportedSyntax'
import { expandWords } from './input/expandGlobs'
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

type LastRan = { typed: string; failed: boolean }

type CommandRun = RunResult & { lastRan: LastRan | null }

type BeforeEachCommand = (command: ParsedCommand) => Promise<void>

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
  const printed = outputs.filter((output) => output.stream === 'stdout')
  const captured = printed.map((output) => (output.unterminated ? output.text : `${output.text}\n`)).join('')

  const existing =
    redirection.append && (await pathExists(ctx.fs, path)) ? await readText(ctx.fs, path) : ''
  await writeText(ctx.fs, path, `${existing}${captured}`)

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

async function runParsedCommand(
  { words, redirection, input }: ParsedCommand,
  ctx: CommandContext,
  locks: CommandLocks,
  access: ShellAccess,
): Promise<RunResult> {
  try {
    const [name, ...args] = await expandWords(ctx, words)

    if (!name && !redirection) return { outputs: [], clearScreen: false }
    if (name === 'clear') return { outputs: [], clearScreen: true }

    const refusal = accessRefusal(name ?? '', redirection, access, locks)
    if (refusal) return { outputs: refusal, clearScreen: false }

    const stdin = input === null ? '' : await readInput(ctx, input)
    if (stdin === null) return { outputs: fail(`bash: ${input}: No such file or directory`), clearScreen: false }

    const problem = redirection ? await redirectionProblem(ctx, redirection) : null
    if (problem) return { outputs: fail(problem), clearScreen: false }

    const outputs = name ? await dispatch(name, args, ctx, locks, stdin) : []
    return {
      outputs: redirection ? await redirect(ctx, outputs, redirection) : outputs,
      clearScreen: false,
    }
  } catch (error) {
    return { outputs: errorOutputs(error), clearScreen: false }
  }
}

function failed(outputs: readonly CommandOutput[]): boolean {
  return outputs.some((output) => output.stream === 'stderr')
}

function skips(connector: Connector | null, previousFailed: boolean): boolean {
  return (connector === '&&' && previousFailed) || (connector === '||' && !previousFailed)
}

async function runCommands(
  commands: readonly ListedCommand[],
  ctx: CommandContext,
  locks: CommandLocks,
  access: ShellAccess,
  beforeEach: BeforeEachCommand,
): Promise<CommandRun> {
  let outputs: CommandOutput[] = []
  let clearScreen = false
  let lastRan: LastRan | null = null

  for (const { connector, command } of commands) {
    if (skips(connector, lastRan?.failed ?? false)) continue
    await beforeEach(command)
    const result = await runParsedCommand(command, ctx, locks, access)
    if (result.clearScreen) {
      outputs = []
      clearScreen = true
    }
    outputs.push(...result.outputs)
    lastRan = { typed: command.typed, failed: failed(result.outputs) }
  }

  return { outputs, clearScreen, lastRan }
}

export async function runCommand(
  line: string,
  ctx: CommandContext,
  locks: CommandLocks = NO_LOCKS,
  access: ShellAccess = 'full',
  beforeEach: BeforeEachCommand = () => Promise.resolve(),
): Promise<CommandRun> {
  const list = parseCommandList(line)
  if (list.kind === 'continues') {
    const message = list.after === '\\' ? LINE_CONTINUES : endsWithOperator(list.after)
    return { outputs: refuse(message), clearScreen: false, lastRan: null }
  }
  if (list.kind === 'syntax-error') {
    const outputs = fail(`bash: syntax error near unexpected token \`${list.token}'`)
    return { outputs, clearScreen: false, lastRan: null }
  }
  if (list.kind === 'unsupported') {
    return { outputs: refuse(unsupportedSyntaxMessage(list.syntax)), clearScreen: false, lastRan: null }
  }
  return runCommands(list.commands, ctx, locks, access, beforeEach)
}
