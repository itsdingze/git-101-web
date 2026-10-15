import { useCallback, useState } from 'react'

interface StageStepper {
  index: number
  atStart: boolean
  atEnd: boolean
  next: () => void
  previous: () => void
  reset: () => void
}

export function useStageStepper(total: number): StageStepper {
  const [index, setIndex] = useState(0)
  const last = total - 1

  const next = useCallback(() => setIndex((current) => Math.min(current + 1, last)), [last])
  const previous = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), [])
  const reset = useCallback(() => setIndex(0), [])

  return { index, atStart: index === 0, atEnd: index === last, next, previous, reset }
}
