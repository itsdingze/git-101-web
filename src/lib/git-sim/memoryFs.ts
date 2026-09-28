export type SandboxStats = {
  isFile: () => boolean
  isDirectory: () => boolean
  isSymbolicLink: () => boolean
  dev: number
  ino: number
  mode: number
  uid: number
  gid: number
  size: number
  atimeMs: number
  mtimeMs: number
  ctimeMs: number
  atime: Date
  mtime: Date
  ctime: Date
}

type ReadOptions = string | { encoding?: string } | null | undefined

export type SandboxFs = {
  promises: {
    readFile: (path: string, options?: ReadOptions) => Promise<string | Uint8Array>
    writeFile: (path: string, data: string | Uint8Array, options?: unknown) => Promise<void>
    unlink: (path: string) => Promise<void>
    readdir: (path: string) => Promise<string[]>
    mkdir: (path: string) => Promise<void>
    rmdir: (path: string) => Promise<void>
    stat: (path: string) => Promise<SandboxStats>
    lstat: (path: string) => Promise<SandboxStats>
    readlink: (path: string) => Promise<string>
    symlink: (target: string, path: string) => Promise<void>
    utimes: (path: string, atime: number, mtime: number) => Promise<void>
  }
}

const FILE_MODE = 0o100644
const DIRECTORY_MODE = 0o40755
const SYMLINK_MODE = 0o120000
const DEVICE = 1

type FsNode = {
  directory: boolean
  symlink: boolean
  content: Uint8Array
  mode: number
  ino: number
  mtimeMs: number
  ctimeMs: number
}

class FsError extends Error {
  readonly code: string

  constructor(code: string, syscall: string, path: string) {
    super(`${code}: ${syscall} '${path}'`)
    this.code = code
  }
}

/**
 * isomorphic-git decides whether a filesystem is promise-based by calling
 * `readFile()` with no arguments and checking the result, so a synchronous
 * throw would get the whole filesystem treated as callback-style.
 */
function promised<A extends unknown[], R>(
  operation: (...args: A) => R,
): (...args: A) => Promise<R> {
  return (...args: A) => {
    try {
      return Promise.resolve(operation(...args))
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }
}

function normalizePath(path: string): string {
  const segments: string[] = []
  for (const segment of String(path).split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      segments.pop()
      continue
    }
    segments.push(segment)
  }
  return `/${segments.join('/')}`
}

function parentPath(path: string): string {
  const cut = path.lastIndexOf('/')
  return cut <= 0 ? '/' : path.slice(0, cut)
}

function encodingOf(options: ReadOptions): string | undefined {
  return typeof options === 'string' ? options : options?.encoding
}

export function createMemoryFs(): SandboxFs {
  const nodes = new Map<string, FsNode>()
  let nextIno = 1
  let clock = 1700000000000

  const stamp = () => {
    clock += 1
    return clock
  }

  const makeNode = (overrides: Partial<FsNode>): FsNode => ({
    directory: false,
    symlink: false,
    content: new Uint8Array(0),
    mode: FILE_MODE,
    ino: nextIno++,
    mtimeMs: stamp(),
    ctimeMs: clock,
    ...overrides,
  })

  nodes.set('/', makeNode({ directory: true, mode: DIRECTORY_MODE }))

  function nodeAt(path: string, syscall: string): FsNode {
    const node = nodes.get(path)
    if (!node) throw new FsError('ENOENT', syscall, path)
    return node
  }

  function directoryAt(path: string, syscall: string): FsNode {
    const node = nodeAt(path, syscall)
    if (!node.directory) throw new FsError('ENOTDIR', syscall, path)
    return node
  }

  function childrenOf(path: string): string[] {
    const prefix = path === '/' ? '/' : `${path}/`
    const names: string[] = []
    for (const key of nodes.keys()) {
      if (key === path || !key.startsWith(prefix)) continue
      const rest = key.slice(prefix.length)
      if (!rest.includes('/')) names.push(rest)
    }
    return names.sort()
  }

  function statsFor(node: FsNode): SandboxStats {
    return {
      isFile: () => !node.directory && !node.symlink,
      isDirectory: () => node.directory,
      isSymbolicLink: () => node.symlink,
      dev: DEVICE,
      ino: node.ino,
      mode: node.mode,
      uid: 1,
      gid: 1,
      size: node.directory ? 0 : node.content.byteLength,
      atimeMs: node.mtimeMs,
      mtimeMs: node.mtimeMs,
      ctimeMs: node.ctimeMs,
      atime: new Date(node.mtimeMs),
      mtime: new Date(node.mtimeMs),
      ctime: new Date(node.ctimeMs),
    }
  }

  function readFile(rawPath: string, options?: ReadOptions): string | Uint8Array {
    const path = normalizePath(rawPath)
    const node = nodeAt(path, 'open')
    if (node.directory) throw new FsError('EISDIR', 'read', path)

    const encoding = encodingOf(options)
    if (encoding === 'utf8' || encoding === 'utf-8') return new TextDecoder().decode(node.content)
    return node.content.slice()
  }

  function writeFile(rawPath: string, data: string | Uint8Array): void {
    const path = normalizePath(rawPath)
    directoryAt(parentPath(path), 'open')

    const existing = nodes.get(path)
    if (existing?.directory) throw new FsError('EISDIR', 'open', path)

    nodes.set(
      path,
      makeNode({
        content: typeof data === 'string' ? new TextEncoder().encode(data) : data.slice(),
        mode: existing?.mode ?? FILE_MODE,
        ino: existing?.ino ?? nextIno++,
      }),
    )
  }

  function unlink(rawPath: string): void {
    const path = normalizePath(rawPath)
    if (nodeAt(path, 'unlink').directory) throw new FsError('EISDIR', 'unlink', path)
    nodes.delete(path)
  }

  function readdir(rawPath: string): string[] {
    const path = normalizePath(rawPath)
    directoryAt(path, 'scandir')
    return childrenOf(path)
  }

  function mkdir(rawPath: string): void {
    const path = normalizePath(rawPath)
    if (nodes.has(path)) throw new FsError('EEXIST', 'mkdir', path)
    directoryAt(parentPath(path), 'mkdir')
    nodes.set(path, makeNode({ directory: true, mode: DIRECTORY_MODE }))
  }

  function rmdir(rawPath: string): void {
    const path = normalizePath(rawPath)
    directoryAt(path, 'rmdir')
    if (childrenOf(path).length > 0) throw new FsError('ENOTEMPTY', 'rmdir', path)
    nodes.delete(path)
  }

  function readlink(rawPath: string): string {
    const path = normalizePath(rawPath)
    const node = nodeAt(path, 'readlink')
    if (!node.symlink) throw new FsError('EINVAL', 'readlink', path)
    return new TextDecoder().decode(node.content)
  }

  function symlink(target: string, rawPath: string): void {
    const path = normalizePath(rawPath)
    if (nodes.has(path)) throw new FsError('EEXIST', 'symlink', path)
    directoryAt(parentPath(path), 'symlink')
    nodes.set(
      path,
      makeNode({ symlink: true, mode: SYMLINK_MODE, content: new TextEncoder().encode(target) }),
    )
  }

  function utimes(rawPath: string, _atime: number, mtime: number): void {
    nodeAt(normalizePath(rawPath), 'utimes').mtimeMs = mtime * 1000
  }

  return {
    promises: {
      readFile: promised(readFile),
      writeFile: promised(writeFile),
      unlink: promised(unlink),
      readdir: promised(readdir),
      mkdir: promised(mkdir),
      rmdir: promised(rmdir),
      stat: promised((rawPath: string) => statsFor(nodeAt(normalizePath(rawPath), 'stat'))),
      lstat: promised((rawPath: string) => statsFor(nodeAt(normalizePath(rawPath), 'lstat'))),
      readlink: promised(readlink),
      symlink: promised(symlink),
      utimes: promised(utimes),
    },
  }
}
