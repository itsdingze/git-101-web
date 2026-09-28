import type { LessonNavState } from '@/types'

export type FooterVariant = 'filled' | 'filled-success' | 'waiting'

type FooterNav = Pick<LessonNavState, 'isLastStep' | 'stepCompleted' | 'checkDisabled' | 'checkResult' | 'continueLocked'>

export type FooterAction = {
  variant: FooterVariant
  label: string
  showContinue: boolean
  disabled: boolean
}

export default function footerAction(
  { isLastStep, stepCompleted, checkDisabled, checkResult, continueLocked }: FooterNav,
  debugMode = false,
): FooterAction {
  const isIncorrect = checkResult === 'incorrect'
  const solved = checkResult === 'correct' || stepCompleted
  const showContinue = debugMode || solved || continueLocked

  const variant: FooterVariant = checkResult === 'correct' ? 'filled-success' : isIncorrect ? 'waiting' : 'filled'

  const label = showContinue
    ? isLastStep
      ? 'Finish Lesson'
      : 'Continue'
    : isIncorrect
      ? 'Pick another answer'
      : 'Check Answer'

  return {
    variant,
    label,
    showContinue,
    disabled: !debugMode && (isIncorrect || (!solved && (continueLocked || checkDisabled))),
  }
}
