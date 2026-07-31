import { parseLine, type Redirection } from './tokenize'
import { runGit } from './runGit'
import { SHELL_COMMANDS } from './commands/shell/registry'
import { describeGitError } from './errors'
import { resolvePath } from './paths'
import { pathExists, readText, writeText } from './fileOperations'
import type { CommandContext, CommandOutput } from './types'

export type RunResult = {
  outputs: CommandOutput[]
  clearScreen: boolean
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
): Promise<CommandOutput[]> {
  if (name === 'git') return runGit(args, ctx)

  const shell = SHELL_COMMANDS[name]
  if (shell) return shell(args, ctx)

  return [{ text: `bash: ${name}: command not found`, stream: 'stderr' }]
}

export async function runCommand(line: string, ctx: CommandContext): Promise<RunResult> {
  const { tokens, redirection } = parseLine(line)
  const [name, ...args] = tokens

  if (!name) return { outputs: [], clearScreen: false }
  if (name === 'clear') return { outputs: [], clearScreen: true }

  try {
    const outputs = await dispatch(name, args, ctx)
    return {
      outputs: redirection ? await redirect(ctx, outputs, redirection) : outputs,
      clearScreen: false,
    }
  } catch (error) {
    return { outputs: [{ text: describeGitError(error), stream: 'stderr' }], clearScreen: false }
  }
}
