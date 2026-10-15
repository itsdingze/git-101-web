import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { globalScope, lastValueIn, projectScope, type ConfigScope } from '@/lib/git-sim/config/configScope'
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
  const globals = scope === 'local' ? [] : ctx.globalConfig.map((entry) => `${entry.key}=${entry.value}`)
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

  const stored = lastValueIn(ctx.globalConfig, key)
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

function cannotOverwrite(key: string): string {
  return [
    `warning: ${key} has multiple values`,
    'error: cannot overwrite multiple values with a single value',
    `       Use a regexp, --add or --replace-all to change ${key}.`,
  ].join('\n')
}

async function scopeFor(ctx: CommandContext, global: boolean): Promise<ConfigScope> {
  if (global) return globalScope(ctx.globalConfig)

  const dir = await findRepoDir(ctx)
  if (!dir) {
    throw new SandboxError('fatal: not in a git directory')
  }
  return projectScope(ctx.fs, dir)
}

type ConfigWrite =
  | { kind: 'unset' }
  | { kind: 'replace-all'; value: string }
  | { kind: 'set'; value: string; pattern: string | undefined }

async function writeValue(scope: ConfigScope, key: string, write: ConfigWrite): Promise<void> {
  const existing = await scope.values(key)
  if (write.kind === 'unset' && existing.length > 1) throw new SandboxError(`warning: ${key} has multiple values`)
  if (write.kind !== 'set') {
    await scope.removeAll(key)
    if (write.kind === 'replace-all') await scope.add(key, write.value)
    return
  }

  const { value, pattern } = write
  if (pattern === undefined && existing.length > 1) throw new SandboxError(cannotOverwrite(key))
  const matches = pattern === undefined ? () => true : (stored: string) => new RegExp(pattern).test(stored)
  if (existing.some(matches)) await scope.replaceWhere(key, matches, value)
  else await scope.add(key, value)
}

async function recordWrite(
  ctx: CommandContext,
  key: string,
  global: boolean,
  write: ConfigWrite,
): Promise<CommandOutput[]> {
  await writeValue(await scopeFor(ctx, global), key, write)
  if (write.kind === 'set' && write.pattern !== undefined) ctx.cutShortConfig.add(key)
  else ctx.cutShortConfig.delete(key)
  return silent
}

export const config: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const global = hasFlag(args, '--global', '--system')
    const operands = operandsOf(args)
    const [typed, value, pattern] = operands
    if (operands.length > MOST_OPERANDS) throw new SandboxError('error: no action specified')

    if (hasFlag(args, '--list', '-l')) {
      return listAll(ctx, global ? 'global' : hasFlag(args, '--local') ? 'local' : 'all')
    }
    if (hasFlag(args, '--unset')) {
      if (!typed) throw new SandboxError('error: wrong number of arguments, should be from 1 to 2')
      return recordWrite(ctx, canonicalKey(typed), global, { kind: 'unset' })
    }
    if (!typed) throw new SandboxError('usage: git config [--global] <name> [<value>]')

    const key = canonicalKey(typed)
    if (value === undefined) return readValue(ctx, key, global)
    if (hasFlag(args, '--replace-all')) return recordWrite(ctx, key, global, { kind: 'replace-all', value })
    return recordWrite(ctx, key, global, { kind: 'set', value, pattern })
  },
}
