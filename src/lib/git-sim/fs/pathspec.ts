import { relativePath } from './paths'
import type { CommandContext } from '@/lib/git-sim/types'

export function repoPrefix(ctx: CommandContext, dir: string): string {
  return relativePath(ctx.cwd, dir)
}

function withinPrefix(path: string, prefix: string): boolean {
  return prefix === '' || path === prefix || path.startsWith(`${prefix}/`)
}

export function specMatcher(spec: string, prefix: string): (path: string) => boolean {
  if (spec === '.' || spec === './' || spec === '*') {
    return (path) => withinPrefix(path, prefix)
  }
  const target = (prefix ? `${prefix}/${spec}` : spec).replace(/\/$/, '')
  return (path) => path === target || path.startsWith(`${target}/`)
}

export function matchAny(
  specs: readonly string[],
  prefix: string,
): (path: string) => boolean {
  const matchers = specs.map((spec) => specMatcher(spec, prefix))
  return (path) => matchers.some((matches) => matches(path))
}
