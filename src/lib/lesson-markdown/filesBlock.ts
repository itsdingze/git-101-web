import type { FileEntry, FileEntryKind, FilesBlock } from '@/types'
import { diskEntries, entriesAt } from '../file-tree/fileTree'
import { homePathFolders, isHomePath } from '../file-tree/homePath'
import type { LineReader } from './LineReader'

const FOLDER_MARK = '/'
const HIDDEN_MARK = '.'
const INDENT = 2

type EntryLine = { name: string; kind: FileEntryKind; hidden: boolean }

export function parseFilesBlock(
  reader: LineReader,
  path: string,
  body: readonly string[],
  fenceLine: number,
): FilesBlock {
  if (!isHomePath(path)) {
    throw reader.error(
      'write the folder\'s path after files the way the terminal shows it, starting at ~, like "```files ~/todo-app"',
      fenceLine,
    )
  }
  const home = parseTree(reader, body, fenceLine)
  if (!entriesAt(diskEntries(home), homePathFolders(path))) {
    const [folder = path] = homePathFolders(path).slice(-1)
    throw reader.error(`list ${path} as a folder in the tree, like "${folder}/", so the window can open there`, fenceLine)
  }
  return { type: 'files', path, home }
}

function parseTree(reader: LineReader, body: readonly string[], fenceLine: number): FileEntry[] {
  const home: FileEntry[] = []
  const openFolders: FileEntry[][] = [home]

  body.forEach((line, index) => {
    const text = line.trim()
    if (!text) return
    const lineNumber = fenceLine + 1 + index
    const depth = (line.length - line.trimStart().length) / INDENT
    const siblings = openFolders[depth]
    if (!siblings) throw indentError(reader, openFolders, depth, lineNumber)
    openFolders.length = depth + 1

    const { name, kind, hidden } = parseEntryLine(reader, text, lineNumber)
    if (siblings.some((listed) => listed.name === name)) {
      throw reader.error(`"${name}" is already listed in this folder`, lineNumber)
    }
    if (kind === 'file') {
      siblings.push({ name, kind, hidden })
      return
    }
    const entries: FileEntry[] = []
    siblings.push({ name, kind, hidden, entries })
    openFolders.push(entries)
  })
  return home
}

function indentError(reader: LineReader, openFolders: readonly FileEntry[][], depth: number, lineNumber: number): Error {
  const deepest = openFolders[openFolders.length - 1] ?? []
  const previous = deepest[deepest.length - 1]
  if (depth === openFolders.length && previous?.kind === 'file') {
    return reader.error(
      `"${previous.name}" is a file, so nothing can sit inside it. Mark a folder with a trailing /, like "notes/"`,
      lineNumber,
    )
  }
  return reader.error('indent each entry two spaces more than the folder it sits in', lineNumber)
}

function parseEntryLine(reader: LineReader, text: string, lineNumber: number): EntryLine {
  const isFolder = text.endsWith(FOLDER_MARK)
  const name = isFolder ? text.slice(0, -FOLDER_MARK.length) : text
  if (!name || name.includes(FOLDER_MARK)) {
    throw reader.error('write one name per line, like "notes/", and indent what sits inside a folder under it', lineNumber)
  }
  return { name, kind: isFolder ? 'folder' : 'file', hidden: name.startsWith(HIDDEN_MARK) }
}
