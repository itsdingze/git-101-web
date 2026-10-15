export type ShellLine = {
  code: string
  comment: string
}

const NOTE_GAP = 2

function whitespaceRunBefore(line: string, index: number): number {
  let start = index
  while (start > 0 && /\s/.test(line[start - 1] ?? '')) start -= 1
  return start
}

function noteStart(line: string): number {
  let quote: string | null = null

  for (const [index, char] of [...line].entries()) {
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char !== '#') continue

    const start = whitespaceRunBefore(line, index)
    const gap = index - start
    if (start === 0 || gap >= NOTE_GAP || (gap === 1 && line[index + 1] === ' ')) return start
  }

  return -1
}

export function splitShellComment(line: string): ShellLine {
  const start = noteStart(line)
  return start === -1 ? { code: line, comment: '' } : { code: line.slice(0, start), comment: line.slice(start) }
}

const TAB_WIDTH = 4

export function renderedWidth(text: string): number {
  let width = 0
  for (const char of text) width = char === '\t' ? (Math.floor(width / TAB_WIDTH) + 1) * TAB_WIDTH : width + 1
  return width
}

function hasTrailingNote(line: ShellLine): boolean {
  return line.code.trim() !== '' && line.comment !== ''
}

export function alignShellComments(lines: readonly string[]): ShellLine[] {
  const split = lines.map(splitShellComment)
  const column = Math.max(0, ...split.filter(hasTrailingNote).map((line) => renderedWidth(line.code)))

  return split.map((line) => {
    if (!hasTrailingNote(line)) return line
    const note = line.comment.trimStart()
    return { code: line.code, comment: `${' '.repeat(column - renderedWidth(line.code) + NOTE_GAP)}${note}` }
  })
}
