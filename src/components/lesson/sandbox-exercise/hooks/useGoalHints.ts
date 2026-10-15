import { useState } from 'react'
import type { SandboxGoal } from '@/types'
import { hintCoach, type CoachLine } from '@/components/lesson/sandbox-exercise/model/coachLines'
import { NO_HINTS_SHOWN, nextHint } from '@/components/lesson/sandbox-exercise/model/hintProgress'

interface GoalHints {
  showNextHint: () => void
  forgetHints: () => void
}

export function useGoalHints(goal: SandboxGoal | undefined, say: (coach: readonly CoachLine[]) => void): GoalHints {
  const [progress, setProgress] = useState(NO_HINTS_SHOWN)

  function showNextHint() {
    if (!goal) return
    const shown = nextHint(progress, goal.id)
    say([hintCoach(goal, shown.index)])
    setProgress(shown.progress)
  }

  return { showNextHint, forgetHints: () => setProgress(NO_HINTS_SHOWN) }
}
