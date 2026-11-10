import { countLineChanges } from './boundedDiff'

type FileDelta = {
  path: string
  insertions: number
  deletions: number
  created: boolean
  removed: boolean
  unmerged?: true
}

const TERMINAL_WIDTH = 80

function countLines(text: string): number {
  if (text === '') return 0
  return text.endsWith('\n') ? text.slice(0, -1).split('\n').length : text.split('\n').length
}

export function unmergedDelta(path: string): FileDelta {
  return { path, insertions: 0, deletions: 0, created: false, removed: false, unmerged: true }
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
    const { insertions, deletions } = countLineChanges(oldText, newText)
    deltas.push({ path, insertions, deletions, created: false, removed: false })
  }

  return deltas
}

export function formatShortStat(deltas: readonly FileDelta[]): string {
  const counted = deltas.filter((delta) => !delta.unmerged)
  const insertions = counted.reduce((total, delta) => total + delta.insertions, 0)
  const deletions = counted.reduce((total, delta) => total + delta.deletions, 0)

  const parts = [`${counted.length} ${counted.length === 1 ? 'file' : 'files'} changed`]
  if (insertions > 0) parts.push(`${insertions} insertion${insertions === 1 ? '' : 's'}(+)`)
  if (deletions > 0) parts.push(`${deletions} deletion${deletions === 1 ? '' : 's'}(-)`)
  return ` ${parts.join(', ')}`
}

type StatLayout = { nameWidth: number; numberWidth: number; graphWidth: number; largest: number }

function statLayout(counted: readonly FileDelta[], longestName: number): StatLayout {
  const largest = Math.max(0, ...counted.map((delta) => delta.insertions + delta.deletions))
  const numberWidth = String(largest).length
  const width = Math.max(TERMINAL_WIDTH, 16 + 6 + numberWidth)
  let nameWidth = longestName
  let graphWidth = largest

  if (nameWidth + numberWidth + 6 + graphWidth > width) {
    const limit = Math.floor((width * 3) / 8) - numberWidth - 6
    if (graphWidth > limit) graphWidth = Math.max(limit, 6)
    if (nameWidth > width - numberWidth - 6 - graphWidth) nameWidth = width - numberWidth - 6 - graphWidth
    else graphWidth = width - numberWidth - 6 - nameWidth
  }

  return { nameWidth, numberWidth, graphWidth, largest }
}

function scaleLinear(value: number, graphWidth: number, largest: number): number {
  return value === 0 ? 0 : 1 + Math.floor((value * (graphWidth - 1)) / largest)
}

function bar({ insertions, deletions }: FileDelta, { graphWidth, largest }: StatLayout): string {
  if (graphWidth > largest) return `${'+'.repeat(insertions)}${'-'.repeat(deletions)}`

  const total = Math.max(scaleLinear(insertions + deletions, graphWidth, largest), insertions > 0 && deletions > 0 ? 2 : 0)
  if (insertions < deletions) {
    const plus = scaleLinear(insertions, graphWidth, largest)
    return `${'+'.repeat(plus)}${'-'.repeat(total - plus)}`
  }
  const minus = scaleLinear(deletions, graphWidth, largest)
  return `${'+'.repeat(total - minus)}${'-'.repeat(minus)}`
}

function shortenedName(path: string, nameWidth: number): string {
  if (path.length <= nameWidth) return path

  const tail = path.slice(path.length - Math.max(0, nameWidth - 3))
  const slash = tail.indexOf('/')
  return `...${slash === -1 ? tail : tail.slice(slash)}`
}

export function formatDiffStat(deltas: readonly FileDelta[]): string {
  if (deltas.length === 0) return ''

  const counted = deltas.filter((delta) => !delta.unmerged)
  const layout = statLayout(counted, Math.max(...deltas.map((delta) => delta.path.length)))

  const rows = deltas.map((delta) => {
    const name = shortenedName(delta.path, layout.nameWidth).padEnd(layout.nameWidth)
    if (delta.unmerged) return ` ${name} | Unmerged`
    const total = delta.insertions + delta.deletions
    return ` ${name} | ${String(total).padStart(layout.numberWidth)} ${bar(delta, layout)}`.trimEnd()
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
