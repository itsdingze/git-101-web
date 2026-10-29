import { isDirectory, listEntries, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import type { ShellWord } from './tokenize'
import type { CommandContext } from '@/lib/git-sim/types'

const WILDCARD = /(?<!\\)(?:\\\\)*[*?]/

function hasWildcard(component: string): boolean {
  return WILDCARD.test(component)
}

function unescape(component: string): string {
  return component.replace(/\\(.)/g, '$1')
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

function componentRegex(component: string): RegExp {
  let source = ''
  for (let index = 0; index < component.length; index += 1) {
    const char = component.charAt(index)
    if (char === '*') source += '.*'
    else if (char === '?') source += '.'
    else if (char === '\\') {
      index += 1
      source += escapeRegex(component.charAt(index))
    } else source += escapeRegex(char)
  }
  return new RegExp(`^${source}$`, 's')
}

async function matchComponent(
  ctx: CommandContext,
  prefix: string,
  component: string,
  directoriesOnly: boolean,
): Promise<string[]> {
  const folder = resolvePath(prefix === '' ? '.' : prefix, ctx.cwd, ctx.root)
  if (!(await isDirectory(ctx.fs, folder))) return []

  const regex = componentRegex(component)
  const showsHidden = component.startsWith('.')
  return (await listEntries(ctx.fs, folder))
    .filter((entry) => showsHidden || !entry.name.startsWith('.'))
    .filter((entry) => regex.test(entry.name) && (!directoriesOnly || entry.directory))
    .map((entry) => `${prefix}${entry.name}`)
}

async function expandPattern(ctx: CommandContext, pattern: string): Promise<string[]> {
  const components = pattern.split('/')
  let matches = ['']

  for (const [index, component] of components.entries()) {
    const separator = index === components.length - 1 ? '' : '/'
    if (!hasWildcard(component)) {
      matches = matches.map((match) => `${match}${unescape(component)}${separator}`)
      continue
    }
    const expanded = await Promise.all(
      matches.map((match) => matchComponent(ctx, match, component, separator !== '')),
    )
    matches = expanded.flat().map((match) => `${match}${separator}`)
  }

  const existing = await Promise.all(
    matches.map(async (match) => ((await pathExists(ctx.fs, resolvePath(match, ctx.cwd, ctx.root))) ? match : null)),
  )
  return existing.filter((match) => match !== null)
}

export async function expandWords(ctx: CommandContext, words: readonly ShellWord[]): Promise<string[]> {
  const expanded = await Promise.all(
    words.map(async (word) => {
      if (word.pattern === null) return [word.text]
      const matches = await expandPattern(ctx, word.pattern)
      return matches.length > 0 ? matches : [word.text]
    }),
  )
  return expanded.flat()
}
