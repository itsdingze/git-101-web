type HistoryPosition = number | null

interface Recalled {
  position: HistoryPosition
  draft: string
}

export const NOT_BROWSING: HistoryPosition = null

export function recall(history: readonly string[], position: HistoryPosition, offset: number): Recalled | null {
  if (history.length === 0) return null

  const current = position ?? history.length
  const next = Math.min(Math.max(current + offset, 0), history.length)
  if (next === history.length) return { position: NOT_BROWSING, draft: '' }
  return { position: next, draft: history[next] ?? '' }
}
