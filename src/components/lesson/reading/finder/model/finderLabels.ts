import type { FileEntry } from '@/types'
import type { FolderLocation } from '@/lib/file-tree/fileTree'
import { messages } from '@/messages/en'

export function folderListLabel(location: FolderLocation, entryCount: number): string {
  const label = messages.reading.finder.filesIn(location.join('/'))
  return entryCount === 0 ? messages.reading.finder.emptyFolder(label) : label
}

export function entryLabel({ name, kind, hidden }: FileEntry): string {
  if (hidden) return messages.reading.finder.hiddenEntry(name, kind)
  return kind === 'folder' ? messages.reading.finder.folder(name) : name
}
