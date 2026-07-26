import { useState, useCallback } from 'react'
import type { WorkflowSubStep } from '@/types'

function normalizeCommand(cmd: string): string {
  return cmd.trim().replace(/\s+/g, ' ').toLowerCase()
}

function filledArray(length: number, value: boolean): boolean[] {
  return Array.from<boolean>({ length }).fill(value)
}

function lastIndex(steps: readonly WorkflowSubStep[]): number {
  return Math.max(steps.length - 1, 0)
}

interface UseWorkflowExerciseReturn {
  currentSubStep: number
  completedSubSteps: boolean[]
  allCompleted: boolean
  handleSubmit: (command: string) => { correct: boolean; hint?: string }
  hintIndex: number
  reset: () => void
}

/**
 * `startCompleted` replays a previously finished workflow in its solved state,
 * matching how the other exercise types hydrate from saved progress.
 */
export default function useWorkflowExercise(
  steps: readonly WorkflowSubStep[],
  startCompleted: boolean,
): UseWorkflowExerciseReturn {
  const [currentSubStep, setCurrentSubStep] = useState(() => (startCompleted ? lastIndex(steps) : 0))
  const [completedSubSteps, setCompletedSubSteps] = useState<boolean[]>(() =>
    filledArray(steps.length, startCompleted),
  )
  const [hintIndex, setHintIndex] = useState(0)

  const allCompleted = completedSubSteps.every(Boolean)

  const handleSubmit = useCallback(
    (command: string): { correct: boolean; hint?: string } => {
      const current = steps[currentSubStep]
      if (!current) return { correct: false, hint: 'No more steps.' }

      const normalized = normalizeCommand(command)
      const expected = normalizeCommand(current.expectedCommand)
      const variants = (current.acceptableVariants ?? []).map(normalizeCommand)

      const prefixMatch = current.acceptPrefix
        ? normalized.startsWith(normalizeCommand(current.acceptPrefix))
        : false

      if (normalized === expected || variants.includes(normalized) || prefixMatch) {
        setCompletedSubSteps((prev) => {
          const next = [...prev]
          next[currentSubStep] = true
          return next
        })
        setCurrentSubStep((prev) => Math.min(prev + 1, steps.length - 1))
        setHintIndex(0)
        return { correct: true }
      }

      const hints = current.hints
      const hint = hints?.[Math.min(hintIndex, hints.length - 1)]
      setHintIndex((i) => Math.min(i + 1, (hints?.length ?? 1) - 1))
      return { correct: false, hint: hint ?? 'Not quite. Try again!' }
    },
    [currentSubStep, hintIndex, steps]
  )

  const reset = useCallback(() => {
    setCurrentSubStep(0)
    setCompletedSubSteps(filledArray(steps.length, false))
    setHintIndex(0)
  }, [steps.length])

  return { currentSubStep, completedSubSteps, allCompleted, handleSubmit, hintIndex, reset }
}
