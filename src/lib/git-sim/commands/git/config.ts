import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { findRepoDir } from '@/lib/git-sim/history/repository'
import { joinPath } from '@/lib/git-sim/fs/paths'
import { pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const SECTION_HEADER = /^\[([^\s\]"]+)(?:\s+"(.*)")?\]$/
const SETTING_LINE = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=\s*(.*))?$/

function unquoted(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value
}

function configFileEntries(text: string): string[] {
  const entries: string[] = []
  let section = ''
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const header = SECTION_HEADER.exec(line)
    if (header) {
      const name = (header[1] ?? '').toLowerCase()
      section = header[2] === undefined ? name : `${name}.${header[2]}`
      continue
    }
    const setting = SETTING_LINE.exec(line)
    if (setting && section !== '') {
      entries.push(`${section}.${(setting[1] ?? '').toLowerCase()}=${unquoted(setting[2] ?? 'true')}`)
    }
  }
  return entries
}

async function projectEntries(ctx: CommandContext): Promise<string[]> {
  const dir = await findRepoDir(ctx)
  if (!dir) return []
  const path = joinPath(dir, '.git/config')
  return (await pathExists(ctx.fs, path)) ? configFileEntries(await readText(ctx.fs, path)) : []
}

async function listAll(ctx: CommandContext, scope: 'global' | 'local' | 'all'): Promise<CommandOutput[]> {
  const globals = scope === 'local' ? [] : [...ctx.globalConfig].map(([key, value]) => `${key}=${value}`)
  const locals = scope === 'global' ? [] : await projectEntries(ctx)
  const entries = [...globals, ...locals]
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

const MOST_OPERANDS = 3
const SECTION_NAME = /^[A-Za-z0-9-]+$/
const VARIABLE_NAME = /^[A-Za-z][A-Za-z0-9-]*$/

function canonicalKey(typed: string): string {
  const firstDot = typed.indexOf('.')
  const lastDot = typed.lastIndexOf('.')
  if (firstDot < 1) throw new SandboxError(`error: key does not contain a section: ${typed}`)
  if (lastDot === typed.length - 1) throw new SandboxError(`error: key does not contain variable name: ${typed}`)

  const section = typed.slice(0, firstDot)
  const variable = typed.slice(lastDot + 1)
  if (!SECTION_NAME.test(section) || !VARIABLE_NAME.test(variable)) {
    throw new SandboxError(`error: invalid key: ${typed}`)
  }
  const subsection = firstDot === lastDot ? [] : [typed.slice(firstDot + 1, lastDot)]
  return [section.toLowerCase(), ...subsection, variable.toLowerCase()].join('.')
}

async function writeValue(
  ctx: CommandContext,
  key: string,
  value: string | undefined,
  global: boolean,
): Promise<CommandOutput[]> {
  if (global) {
    if (value === undefined) ctx.globalConfig.delete(key)
    else ctx.globalConfig.set(key, value)
    return silent
  }

  const dir = await findRepoDir(ctx)
  if (!dir) {
    throw new SandboxError('fatal: not in a git directory')
  }
  await git.setConfig({ fs: gitFs(ctx.fs), dir, path: key, value })
  return silent
}

export const config: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const global = hasFlag(args, '--global', '--system')
    const operands = operandsOf(args)
    const [typed, value] = operands
    if (operands.length > MOST_OPERANDS) throw new SandboxError('error: no action specified')

    if (hasFlag(args, '--list', '-l')) {
      return listAll(ctx, global ? 'global' : hasFlag(args, '--local') ? 'local' : 'all')
    }
    if (hasFlag(args, '--unset')) {
      if (!typed) throw new SandboxError('error: wrong number of arguments, should be from 1 to 2')
      return writeValue(ctx, canonicalKey(typed), undefined, global)
    }
    if (!typed) throw new SandboxError('usage: git config [--global] <name> [<value>]')

    const key = canonicalKey(typed)
    return value === undefined ? readValue(ctx, key, global) : writeValue(ctx, key, value, global)
  },
}
