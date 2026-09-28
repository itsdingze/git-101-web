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

const ALIGN_LIMIT = 40

function hasTrailingNote(line: ShellLine): boolean {
  return line.code.trim() !== '' && line.comment !== ''
}

export function alignShellComments(lines: readonly string[]): ShellLine[] {
  const split = lines.map(splitShellComment)
  const column = Math.max(
    0,
    ...split.filter(hasTrailingNote).map((line) => line.code.length).filter((length) => length <= ALIGN_LIMIT),
  )

  return split.map((line) => {
    if (!hasTrailingNote(line)) return line
    const note = line.comment.trimStart()
    const padding = line.code.length <= ALIGN_LIMIT ? column - line.code.length + NOTE_GAP : NOTE_GAP
    return { code: line.code, comment: `${' '.repeat(padding)}${note}` }
  })
}
