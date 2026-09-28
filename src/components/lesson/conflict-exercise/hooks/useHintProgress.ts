import { useState } from 'react'

export type HintProgress = {
  hintIndex: number
  showHint: boolean
  advance: () => void
  toggle: () => void
  reset: () => void
}

export default function useHintProgress(hintCount: number): HintProgress {
  const [hintIndex, setHintIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)

  return {
    hintIndex,
    showHint,
    advance: () => setHintIndex((previous) => Math.min(previous + 1, hintCount - 1)),
    toggle: () => setShowHint((previous) => !previous),
    reset: () => {
      setHintIndex(0)
      setShowHint(false)
    },
  }
}
