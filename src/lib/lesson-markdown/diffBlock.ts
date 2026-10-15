import type { DiffBlock, DiffLine, DiffLineChange } from '@/types'
import { homePathFolders, isHomePath } from '../file-tree/homePath'
import type { LineReader } from './LineReader'

const CHANGES: Readonly<Record<string, DiffLineChange>> = { ' ': 'unchanged', '+': 'added', '-': 'removed' }
const HOME = '~'

export function parseDiffBlock(
  reader: LineReader,
  path: string,
  body: readonly string[],
  fenceLine: number,
): DiffBlock {
  if (!isHomePath(path) || path === HOME) {
    throw reader.error(
      'write the file\'s path after diff the way the terminal shows it, starting at ~, like "```diff ~/projects/todo-app/app.py"',
      fenceLine,
    )
  }
  const [folder = '', fileName = ''] = homePathFolders(path).slice(-2)
  const lines = body.map((line, index) => parseDiffLine(reader, line, fenceLine + 1 + index))
  return { type: 'diff', path, fileName, folder, lines }
}

function parseDiffLine(reader: LineReader, line: string, lineNumber: number): DiffLine {
  if (line === '') return { change: 'unchanged', text: '' }
  const change = CHANGES[line.charAt(0)]
  if (!change) {
    throw reader.error('start each diff line with a space (unchanged), + (added) or - (removed)', lineNumber)
  }
  return { change, text: line.slice(1) }
}
