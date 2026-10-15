function normalizeSegments(segments: readonly string[]): string[] {
  const resolved: string[] = []
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      resolved.pop()
      continue
    }
    resolved.push(segment)
  }
  return resolved
}

export function isInside(target: string, root: string): boolean {
  return target === root || target.startsWith(`${root}/`)
}

export function resolvePath(input: string, cwd: string, root: string): string {
  const expanded = input.startsWith('~')
    ? `${root}${input.slice(1)}`
    : input.startsWith('/')
      ? input
      : `${cwd}/${input}`
  const absolute = `/${normalizeSegments(expanded.split('/')).join('/')}`
  return isInside(absolute, root) ? absolute : root
}

export function displayPath(absolute: string, root: string): string {
  if (absolute === root) return '~'
  return isInside(absolute, root) ? `~/${absolute.slice(root.length + 1)}` : absolute
}

export function basename(absolute: string): string {
  const segments = absolute.split('/')
  return segments[segments.length - 1] ?? ''
}

export function dirname(absolute: string): string {
  const segments = absolute.split('/')
  segments.pop()
  return segments.join('/') || '/'
}

export function joinPath(base: string, child: string): string {
  if (!child) return base
  return base.endsWith('/') ? `${base}${child}` : `${base}/${child}`
}

export function pathFrom(from: string, to: string): string {
  const folder = to.endsWith('/') && to !== '/'
  const fromParts = from.split('/').filter(Boolean)
  const toParts = to.split('/').filter(Boolean)
  let shared = 0
  while (shared < fromParts.length && fromParts[shared] === toParts[shared]) shared += 1

  const climb = fromParts.slice(shared).map(() => '..')
  const relative = [...climb, ...toParts.slice(shared)].join('/')
  if (relative === '') return './'
  return folder ? `${relative}/` : relative
}

export function relativePath(absolute: string, base: string): string {
  if (absolute === base) return ''
  return absolute.startsWith(`${base}/`) ? absolute.slice(base.length + 1) : absolute
}
