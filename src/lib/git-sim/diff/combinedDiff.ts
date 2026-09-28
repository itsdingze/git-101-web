import { diffArrays } from 'diff'

const CONTEXT = 3

type Row = {
  columns: string
  text: string
  parentLine: (number | null)[]
  resultLine: number | null
}

function linesOf(text: string): string[] {
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

type ParentMatch = {
  matched: boolean[]
  deletedBefore: Map<number, string[]>
  lineOfResult: (number | null)[]
  deletedLineNumbers: Map<number, number[]>
}

function matchParent(parent: readonly string[], result: readonly string[]): ParentMatch {
  const matched = result.map(() => false)
  const lineOfResult: (number | null)[] = result.map(() => null)
  const deletedBefore = new Map<number, string[]>()
  const deletedLineNumbers = new Map<number, number[]>()
  let resultIndex = 0
  let parentIndex = 0

  for (const part of diffArrays([...parent], [...result])) {
    for (const line of part.value) {
      if (part.added) {
        resultIndex += 1
      } else if (part.removed) {
        deletedBefore.set(resultIndex, [...(deletedBefore.get(resultIndex) ?? []), line])
        deletedLineNumbers.set(resultIndex, [...(deletedLineNumbers.get(resultIndex) ?? []), parentIndex + 1])
        parentIndex += 1
      } else {
        matched[resultIndex] = true
        lineOfResult[resultIndex] = parentIndex + 1
        resultIndex += 1
        parentIndex += 1
      }
    }
  }
  return { matched, deletedBefore, lineOfResult, deletedLineNumbers }
}

function buildRows(parents: readonly ParentMatch[], result: readonly string[]): Row[] {
  const rows: Row[] = []
  for (let index = 0; index <= result.length; index += 1) {
    parents.forEach((parent, which) => {
      const deleted = parent.deletedBefore.get(index) ?? []
      const numbers = parent.deletedLineNumbers.get(index) ?? []
      deleted.forEach((text, at) => {
        rows.push({
          columns: parents.map((_, column) => (column === which ? '-' : ' ')).join(''),
          text,
          parentLine: parents.map((_, column) => (column === which ? (numbers[at] ?? null) : null)),
          resultLine: null,
        })
      })
    })
    const text = result[index]
    if (text === undefined) continue
    rows.push({
      columns: parents.map((parent) => (parent.matched[index] ? ' ' : '+')).join(''),
      text,
      parentLine: parents.map((parent) => parent.lineOfResult[index] ?? null),
      resultLine: index + 1,
    })
  }
  return rows
}

function hunkRanges(rows: readonly Row[]): [number, number][] {
  const ranges: [number, number][] = []
  rows.forEach((row, index) => {
    if (!row.columns.trim()) return
    const start = Math.max(0, index - CONTEXT)
    const end = Math.min(rows.length, index + CONTEXT + 1)
    const last = ranges[ranges.length - 1]
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else ranges.push([start, end])
  })
  return ranges
}

function takesOneSide(hunk: readonly Row[], parents: number): boolean {
  for (let column = 0; column < parents; column += 1) {
    if (hunk.every((row) => row.columns[column] === ' ')) return true
  }
  return false
}

function range(numbers: readonly (number | null)[]): string {
  const present = numbers.filter((value): value is number => value !== null)
  const count = present.length
  const start = present[0] ?? 0
  if (count === 0) return `${Math.max(start - 1, 0)},0`
  return count === 1 ? `${start}` : `${start},${count}`
}

function hunkHeader(hunk: readonly Row[], parents: number): string {
  const sides = Array.from({ length: parents }, (_, column) => `-${range(hunk.map((row) => row.parentLine[column] ?? null))}`)
  const merged = `+${range(hunk.map((row) => row.resultLine))}`
  const marks = '@'.repeat(parents + 1)
  return `${marks} ${sides.join(' ')} ${merged} ${marks}`
}

export function combinedDiffLines(ours: string, theirs: string, result: string): string[] {
  const resultLines = linesOf(result)
  const parents = [matchParent(linesOf(ours), resultLines), matchParent(linesOf(theirs), resultLines)]
  const rows = buildRows(parents, resultLines)

  return hunkRanges(rows)
    .map(([start, end]) => rows.slice(start, end))
    .filter((hunk) => !takesOneSide(hunk, parents.length))
    .flatMap((hunk) => [hunkHeader(hunk, parents.length), ...hunk.map((row) => `${row.columns}${row.text}`)])
}
