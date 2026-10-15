import type { SandboxFs, SandboxStats } from './sandboxFs'
import { dirname, joinPath } from './paths'

async function statOrNull(fs: SandboxFs, path: string): Promise<SandboxStats | null> {
  try {
    return await fs.promises.stat(path)
  } catch {
    return null
  }
}

export async function pathExists(fs: SandboxFs, path: string): Promise<boolean> {
  return (await statOrNull(fs, path)) !== null
}

export async function isDirectory(fs: SandboxFs, path: string): Promise<boolean> {
  const stats = await statOrNull(fs, path)
  return stats?.isDirectory() ?? false
}

export async function readText(fs: SandboxFs, path: string): Promise<string> {
  const contents = await fs.promises.readFile(path, 'utf8')
  return typeof contents === 'string' ? contents : new TextDecoder().decode(contents)
}

type ParentFolderProblem = 'No such file or directory' | 'Not a directory'

export async function parentFolderProblem(
  fs: SandboxFs,
  path: string,
  createMissing: boolean,
): Promise<ParentFolderProblem | null> {
  let nearest = dirname(path)
  while (!(await pathExists(fs, nearest))) nearest = dirname(nearest)

  if (!(await isDirectory(fs, nearest))) return 'Not a directory'
  if (nearest !== dirname(path) && !createMissing) return 'No such file or directory'
  return null
}

export async function makeDirectory(fs: SandboxFs, path: string): Promise<void> {
  const parent = dirname(path)
  if (parent !== path && parent !== '/' && !(await pathExists(fs, parent))) {
    await makeDirectory(fs, parent)
  }
  if (!(await pathExists(fs, path))) await fs.promises.mkdir(path)
}

// Git trusts a matching stat, so same-length edits in one millisecond would read as unchanged without a distinct mtime per write.
let writeClock = 1700000000

async function stampWrite(fs: SandboxFs, path: string): Promise<void> {
  writeClock += 1
  await fs.promises.utimes(path, writeClock, writeClock)
}

export async function writeText(fs: SandboxFs, path: string, contents: string): Promise<void> {
  await makeDirectory(fs, dirname(path))
  await fs.promises.writeFile(path, contents)
  await stampWrite(fs, path)
}

export async function removeTree(fs: SandboxFs, path: string): Promise<void> {
  if (await isDirectory(fs, path)) {
    for (const entry of await fs.promises.readdir(path)) {
      await removeTree(fs, joinPath(path, entry))
    }
    await fs.promises.rmdir(path)
    return
  }
  await fs.promises.unlink(path)
}

export async function writeOrRemove(fs: SandboxFs, path: string, contents: string | undefined): Promise<void> {
  if (contents !== undefined) await writeText(fs, path, contents)
  else if (await pathExists(fs, path)) await removeTree(fs, path)
}

export async function copyTree(fs: SandboxFs, from: string, to: string): Promise<void> {
  if (!(await pathExists(fs, from))) return

  if (await isDirectory(fs, from)) {
    await makeDirectory(fs, to)
    for (const entry of await fs.promises.readdir(from)) {
      await copyTree(fs, joinPath(from, entry), joinPath(to, entry))
    }
    return
  }

  await makeDirectory(fs, dirname(to))
  await fs.promises.writeFile(to, await fs.promises.readFile(from))
  await stampWrite(fs, to)
}

export async function listEntries(
  fs: SandboxFs,
  path: string,
): Promise<{ name: string; directory: boolean }[]> {
  const names = await fs.promises.readdir(path)
  const entries = await Promise.all(
    names.map(async (name) => ({
      name,
      directory: await isDirectory(fs, joinPath(path, name)),
    })),
  )
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}
