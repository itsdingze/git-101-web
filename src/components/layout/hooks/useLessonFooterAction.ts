import { useLessonNav } from '@/hooks/useLessonNav'

type ActionVariant = 'filled' | 'filled-success' | 'filled-danger'

interface LessonFooterAction {
  variant: ActionVariant
  label: string
  showContinue: boolean
  disabled: boolean
  onClick: (() => void) | undefined
}

export default function useLessonFooterAction(): LessonFooterAction {
  const { onNext, isLastStep, stepCompleted, checkDisabled, checkResult, triggerCheck } = useLessonNav()

  const isIncorrect = checkResult === 'incorrect'
  const showContinue = checkResult === 'correct' || stepCompleted

  const variant: ActionVariant =
    checkResult === 'correct' ? 'filled-success' : isIncorrect ? 'filled-danger' : 'filled'

  const label = showContinue
    ? isLastStep
      ? 'Finish Lesson'
      : 'Continue'
    : isIncorrect
      ? 'Try Again'
      : 'Check Answer'

  return {
    variant,
    label,
    showContinue,
    disabled: isIncorrect || (!showContinue && checkDisabled),
    onClick: showContinue ? onNext ?? undefined : triggerCheck,
  }
}
