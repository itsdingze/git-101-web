import type { ConflictExerciseStep } from '@/types'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import { checkResolution } from '@/components/lesson/conflict-exercise/resolutionCheck'
import useConflictBuffer from './useConflictBuffer'
import useHintProgress, { type HintProgress } from './useHintProgress'
import useResolutionFeedback, {
  type ResolutionFailure,
  type ResolutionFeedback,
} from './useResolutionFeedback'

type ConflictResolutionState = {
  buffer: string
  solved: boolean
  failure: ResolutionFailure | null
  shake: boolean
  hintIndex: number
  showHint: boolean
  edit: (text: string) => void
  toggleHint: () => void
  reset: () => void
}

type Grading = {
  feedback: ResolutionFeedback
  hints: HintProgress
  onSolved: () => void
}

function grade(step: ConflictExerciseStep, buffer: string, grading: Grading): boolean {
  const verdict = checkResolution(step, buffer)
  if (verdict === 'solved') {
    grading.feedback.clearFailure()
    grading.onSolved()
    return true
  }

  grading.feedback.reportFailure(verdict)
  if (verdict === 'wrong-content') grading.hints.advance()
  return false
}

export default function useConflictResolution(
  step: ConflictExerciseStep,
  lessonId: number,
): ConflictResolutionState {
  const completeStep = useProgressStore((s) => s.completeStep)
  const solved = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])
  const feedback = useResolutionFeedback()
  const hints = useHintProgress(step.hints?.length ?? 1)
  const buffer = useConflictBuffer(step, solved, feedback.clearFailure)
  const grading = { feedback, hints, onSolved: () => completeStep(lessonId, step.id) }

  useExerciseNav({
    solved,
    checkFn: () => grade(step, buffer.text, grading),
    checkDisabled: buffer.text.trim() === '',
  })

  return {
    buffer: buffer.text,
    solved,
    failure: feedback.failure,
    shake: feedback.shake,
    hintIndex: hints.hintIndex,
    showHint: hints.showHint,
    edit: buffer.edit,
    toggleHint: hints.toggle,
    reset: () => [buffer, feedback, hints].forEach((part) => part.reset()),
  }
}
