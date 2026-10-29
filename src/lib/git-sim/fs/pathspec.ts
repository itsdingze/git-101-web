import { relativePath } from './paths'
import { SandboxError } from '@/lib/git-sim/errors'
import type { CommandContext } from '@/lib/git-sim/types'

const WILDCARD = /[*?[]/

export function repoPrefix(ctx: CommandContext, dir: string): string {
  return relativePath(ctx.cwd, dir)
}

export function specTarget(spec: string, prefix: string): string | null {
  const resolved: string[] = []
  for (const segment of `${prefix}/${spec}`.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment !== '..') resolved.push(segment)
    else if (resolved.pop() === undefined) return null
  }
  return resolved.join('/')
}

export function refuseOutsideRepository(spec: string, prefix: string, dir: string): void {
  if (specTarget(spec, prefix) !== null) return
  throw new SandboxError(`fatal: ${spec}: '${spec}' is outside repository at '${dir}'`)
}

function bracketClass(body: string): string {
  const negated = body.startsWith('!') || body.startsWith('^')
  const members = (negated ? body.slice(1) : body).replace(/[\\\]^]/g, '\\$&')
  return `[${negated ? '^' : ''}${members}]`
}

function globPattern(glob: string): RegExp {
  let source = ''
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index] ?? ''
    const close = character === '[' ? glob.indexOf(']', index + 2) : -1
    if (character === '*') source += '.*'
    else if (character === '?') source += '.'
    else if (close !== -1) {
      source += bracketClass(glob.slice(index + 1, close))
      index = close
    } else source += character.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  }
  return new RegExp(`^${source}$`)
}

export function specMatcher(spec: string, prefix: string): (path: string) => boolean {
  const target = specTarget(spec, prefix)
  if (target === null) return () => false
  const literal = (path: string) => target === '' || path === target || path.startsWith(`${target}/`)
  if (!WILDCARD.test(spec)) return literal

  const pattern = globPattern(target)
  return (path) => literal(path) || pattern.test(path)
}

export function matchAny(
  specs: readonly string[],
  prefix: string,
): (path: string) => boolean {
  const matchers = specs.map((spec) => specMatcher(spec, prefix))
  return (path) => matchers.some((matches) => matches(path))
}
