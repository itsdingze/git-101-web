import type { DiffLine } from '@/types'
import { conflictMarker } from './conflictMarker'

export type ConflictRegion = 'current-header' | 'current' | 'incoming' | 'incoming-header'

type DiffRow = DiffLine & {
  key: string
  number: number | null
  conflict: ConflictRegion | null
}

export function diffRows(lines: readonly DiffLine[]): DiffRow[] {
  let oldNumber = 0
  let newNumber = 0
  let side: 'current' | 'incoming' | null = null
  return lines.map((line) => {
    if (line.change !== 'added') oldNumber++
    if (line.change !== 'removed') newNumber++
    const number = line.change === 'removed' ? null : newNumber
    const key = line.change === 'added' ? `added-${newNumber}` : `${line.change}-${oldNumber}`
    let conflict: ConflictRegion | null = side
    const marker = conflictMarker(line.text)
    if (marker === 'current') {
      conflict = 'current-header'
      side = 'current'
    } else if (side && marker === 'divider') {
      conflict = null
      side = 'incoming'
    } else if (side && marker === 'incoming') {
      conflict = 'incoming-header'
      side = null
    }
    return { ...line, key, number, conflict }
  })
}
