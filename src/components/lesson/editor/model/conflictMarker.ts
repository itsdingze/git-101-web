type ConflictMarker = 'current' | 'divider' | 'incoming'

const MARKER = /^(<{7}|={7}|>{7})( |$)/

const MARKERS: Readonly<Record<string, ConflictMarker>> = {
  '<': 'current',
  '=': 'divider',
  '>': 'incoming',
}

export function conflictMarker(line: string): ConflictMarker | null {
  const fence = MARKER.exec(line)?.[1]
  return fence ? (MARKERS[fence.charAt(0)] ?? null) : null
}
