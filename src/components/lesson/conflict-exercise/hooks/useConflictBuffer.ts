import { useState } from 'react'
import type { ConflictExerciseStep } from '@/types'
import {
  composeConflictedFile,
  composeResolvedFile,
} from '@/components/lesson/conflict-exercise/conflictFileText'

export type ConflictBuffer = {
  text: string
  edit: (text: string) => void
  reset: () => void
}

export default function useConflictBuffer(
  step: ConflictExerciseStep,
  solved: boolean,
  onEdit: () => void,
): ConflictBuffer {
  const [text, setText] = useState(() =>
    solved
      ? composeResolvedFile(step, step.acceptableResolutions[0] ?? '')
      : composeConflictedFile(step),
  )

  return {
    text,
    edit: (next) => {
      setText(next)
      onEdit()
    },
    reset: () => setText(composeConflictedFile(step)),
  }
}
