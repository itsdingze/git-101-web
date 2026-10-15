import git, { type TreeEntry } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandContext } from '@/lib/git-sim/types'

const encoder = new TextEncoder()

export async function writeFilesTree(
  ctx: CommandContext,
  dir: string,
  files: ReadonlyMap<string, string>,
): Promise<string> {
  const fs = gitFs(ctx.fs)
  const entries: TreeEntry[] = []
  const folders = new Map<string, Map<string, string>>()

  for (const [path, contents] of files) {
    const slash = path.indexOf('/')
    if (slash === -1) {
      const oid = await git.writeBlob({ fs, dir, blob: encoder.encode(contents) })
      entries.push({ mode: '100644', path, oid, type: 'blob' })
      continue
    }
    const folder = path.slice(0, slash)
    const inside = folders.get(folder) ?? new Map<string, string>()
    inside.set(path.slice(slash + 1), contents)
    folders.set(folder, inside)
  }

  for (const [folder, inside] of folders) {
    entries.push({ mode: '040000', path: folder, oid: await writeFilesTree(ctx, dir, inside), type: 'tree' })
  }

  return git.writeTree({ fs, dir, tree: entries })
}
