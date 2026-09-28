import { diffLines } from 'diff'

export type FileDelta = {
  path: string
  insertions: number
  deletions: number
  created: boolean
  removed: boolean
}

const MAX_BAR_WIDTH = 52

function countLines(text: string): number {
  if (text === '') return 0
  return text.endsWith('\n') ? text.slice(0, -1).split('\n').length : text.split('\n').length
}

function countChanges(before: string, after: string): { insertions: number; deletions: number } {
  let insertions = 0
  let deletions = 0
  for (const part of diffLines(before, after)) {
    const lines = part.count ?? 0
    if (part.added) insertions += lines
    else if (part.removed) deletions += lines
  }
  return { insertions, deletions }
}

export function compareTrees(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
): FileDelta[] {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort()
  const deltas: FileDelta[] = []

  for (const path of paths) {
    const oldText = before.get(path)
    const newText = after.get(path)
    if (oldText === newText) continue

    if (oldText === undefined) {
      deltas.push({ path, insertions: countLines(newText ?? ''), deletions: 0, created: true, removed: false })
      continue
    }
    if (newText === undefined) {
      deltas.push({ path, insertions: 0, deletions: countLines(oldText), created: false, removed: true })
      continue
    }
    const { insertions, deletions } = countChanges(oldText, newText)
    deltas.push({ path, insertions, deletions, created: false, removed: false })
  }

  return deltas
}

export function formatShortStat(deltas: readonly FileDelta[]): string {
  const insertions = deltas.reduce((total, delta) => total + delta.insertions, 0)
  const deletions = deltas.reduce((total, delta) => total + delta.deletions, 0)

  const parts = [`${deltas.length} ${deltas.length === 1 ? 'file' : 'files'} changed`]
  if (insertions > 0) parts.push(`${insertions} insertion${insertions === 1 ? '' : 's'}(+)`)
  if (deletions > 0) parts.push(`${deletions} deletion${deletions === 1 ? '' : 's'}(-)`)
  return ` ${parts.join(', ')}`
}

function bar(delta: FileDelta, scale: number): string {
  const plus = Math.max(delta.insertions > 0 ? 1 : 0, Math.round(delta.insertions * scale))
  const minus = Math.max(delta.deletions > 0 ? 1 : 0, Math.round(delta.deletions * scale))
  return `${'+'.repeat(plus)}${'-'.repeat(minus)}`
}

export function formatDiffStat(deltas: readonly FileDelta[]): string {
  if (deltas.length === 0) return ''

  const pathWidth = Math.max(...deltas.map((delta) => delta.path.length))
  const totals = deltas.map((delta) => delta.insertions + delta.deletions)
  const countWidth = Math.max(...totals.map((total) => String(total).length))
  const widest = Math.max(...totals)
  const scale = widest > MAX_BAR_WIDTH ? MAX_BAR_WIDTH / widest : 1

  const rows = deltas.map((delta, index) => {
    const total = totals[index] ?? 0
    return ` ${delta.path.padEnd(pathWidth)} | ${String(total).padStart(countWidth)} ${bar(delta, scale)}`
  })

  return [...rows, formatShortStat(deltas)].join('\n')
}

export function formatModeChanges(deltas: readonly FileDelta[]): string[] {
  return deltas.flatMap((delta) => {
    if (delta.created) return [` create mode 100644 ${delta.path}`]
    if (delta.removed) return [` delete mode 100644 ${delta.path}`]
    return []
  })
}
