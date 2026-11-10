import { diffLines, structuredPatch } from 'diff'

type Hunk = {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

type LineChanges = { insertions: number; deletions: number }

const MAX_EDIT_LENGTH = 2000
const NO_NEWLINE = '\\ No newline at end of file'

type SplitFile = { lines: string[]; endsWithNewline: boolean }

function splitFile(text: string): SplitFile {
  const endsWithNewline = text === '' || text.endsWith('\n')
  const lines = text === '' ? [] : text.split('\n')
  if (endsWithNewline && lines.length > 0) lines.pop()
  return { lines, endsWithNewline }
}

function isLastLine(index: number, file: SplitFile): boolean {
  return index === file.lines.length - 1
}

function sameLine(a: SplitFile, aIndex: number, b: SplitFile, bIndex: number): boolean {
  if (a.lines[aIndex] !== b.lines[bIndex]) return false
  return (isLastLine(aIndex, a) && !a.endsWithNewline) === (isLastLine(bIndex, b) && !b.endsWithNewline)
}

function commonPrefixLength(before: SplitFile, after: SplitFile): number {
  let length = 0
  while (length < before.lines.length && length < after.lines.length && sameLine(before, length, after, length)) length += 1
  return length
}

function commonSuffixLength(before: SplitFile, after: SplitFile, prefix: number): number {
  let length = 0
  while (
    length < before.lines.length - prefix &&
    length < after.lines.length - prefix &&
    sameLine(before, before.lines.length - 1 - length, after, after.lines.length - 1 - length)
  ) {
    length += 1
  }
  return length
}

function changedLines(file: SplitFile, start: number, end: number, marker: string): string[] {
  const lines: string[] = []
  for (let index = start; index < end; index += 1) {
    lines.push(`${marker}${file.lines[index] ?? ''}`)
    if (isLastLine(index, file) && !file.endsWithNewline) lines.push(NO_NEWLINE)
  }
  return lines
}

function wholeChangeHunk(beforeText: string, afterText: string, context: number): Hunk {
  const before = splitFile(beforeText)
  const after = splitFile(afterText)
  const prefix = commonPrefixLength(before, after)
  const suffix = commonSuffixLength(before, after, prefix)
  const oldChangeEnd = before.lines.length - suffix
  const newChangeEnd = after.lines.length - suffix

  const contextBefore = Math.min(context, prefix)
  const contextAfter = Math.min(context, suffix)
  const oldStart = prefix - contextBefore
  const newStart = prefix - contextBefore
  const oldEnd = oldChangeEnd + contextAfter
  const newEnd = newChangeEnd + contextAfter

  return {
    oldStart: oldStart + 1,
    oldLines: oldEnd - oldStart,
    newStart: newStart + 1,
    newLines: newEnd - newStart,
    lines: [
      ...changedLines(before, oldStart, oldStart + contextBefore, ' '),
      ...changedLines(before, prefix, oldChangeEnd, '-'),
      ...changedLines(after, prefix, newChangeEnd, '+'),
      ...changedLines(before, oldChangeEnd, oldEnd, ' '),
    ],
  }
}

export function fileHunks(path: string, before: string, after: string, context: number): Hunk[] {
  const patch = structuredPatch(path, path, before, after, '', '', { context, maxEditLength: MAX_EDIT_LENGTH })
  return patch ? patch.hunks : [wholeChangeHunk(before, after, context)]
}

export function countLineChanges(before: string, after: string): LineChanges {
  const parts = diffLines(before, after, { maxEditLength: MAX_EDIT_LENGTH })
  if (!parts) {
    const old = splitFile(before)
    const updated = splitFile(after)
    const prefix = commonPrefixLength(old, updated)
    const suffix = commonSuffixLength(old, updated, prefix)
    return { insertions: updated.lines.length - prefix - suffix, deletions: old.lines.length - prefix - suffix }
  }

  let insertions = 0
  let deletions = 0
  for (const part of parts) {
    const lines = part.count ?? 0
    if (part.added) insertions += lines
    else if (part.removed) deletions += lines
  }
  return { insertions, deletions }
}
