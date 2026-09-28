import { useState } from 'react'
import type { ResolutionVerdict } from '@/components/lesson/conflict-exercise/resolutionCheck'

export type ResolutionFailure = Exclude<ResolutionVerdict, 'solved'>

export type ResolutionFeedback = {
  failure: ResolutionFailure | null
  shake: boolean
  reportFailure: (failure: ResolutionFailure) => void
  clearFailure: () => void
  reset: () => void
}

const SHAKE_DURATION_MS = 500

export default function useResolutionFeedback(): ResolutionFeedback {
  const [failure, setFailure] = useState<ResolutionFailure | null>(null)
  const [shake, setShake] = useState(false)

  return {
    failure,
    shake,
    reportFailure: (next) => {
      setFailure(next)
      setShake(true)
      setTimeout(() => setShake(false), SHAKE_DURATION_MS)
    },
    clearFailure: () => setFailure(null),
    reset: () => {
      setFailure(null)
      setShake(false)
    },
  }
}
