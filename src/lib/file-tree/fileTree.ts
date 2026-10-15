import type { FileEntry } from '@/types'
import { homePathFolders } from './homePath'

export type FolderLocation = readonly string[]

export function diskEntries(home: readonly FileEntry[]): readonly FileEntry[] {
  return homePathFolders('~').reduceRight<readonly FileEntry[]>(
    (inside, name) => [{ name, kind: 'folder', hidden: false, entries: inside }],
    home,
  )
}

export function entriesAt(entries: readonly FileEntry[], location: FolderLocation): readonly FileEntry[] | null {
  const [name, ...rest] = location
  if (name === undefined) return entries
  const folder = entries.find((entry) => entry.name === name)
  return folder?.kind === 'folder' ? entriesAt(folder.entries, rest) : null
}
