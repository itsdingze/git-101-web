import { useCallback, useRef, useState } from 'react'
import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import type { SandboxExerciseStep } from '@/types'
import type { CoachState } from '@/components/lesson/sandbox-exercise/model/coachLines'
import { activeGoalIndex, advanceCoachState, startingCoachState } from '@/components/lesson/sandbox-exercise/model/goalTracker'

interface GoalProgress {
  allCompleted: boolean
  activeGoalIndex: number
  current: () => CoachState
  advance: (snapshot: RepoSnapshot) => CoachState
  startAgain: () => void
}

export function useGoalProgress(step: SandboxExerciseStep): GoalProgress {
  const latest = useRef<CoachState>(startingCoachState(step))
  const [completed, setCompleted] = useState<readonly boolean[]>(() => startingCoachState(step).completed)

  const current = useCallback(() => latest.current, [])

  const advance = useCallback(
    (snapshot: RepoSnapshot) => {
      latest.current = advanceCoachState(step, latest.current, snapshot)
      setCompleted(latest.current.completed)
      return latest.current
    },
    [step],
  )

  const startAgain = useCallback(() => {
    latest.current = startingCoachState(step)
  }, [step])

  return {
    allCompleted: completed.length > 0 && completed.every(Boolean),
    activeGoalIndex: activeGoalIndex(completed),
    current,
    advance,
    startAgain,
  }
}
