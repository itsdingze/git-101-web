import type { LessonNavState } from '@/contexts/lesson-nav/lessonNav'
import { messages } from '@/messages/en'

type FooterVariant = 'filled' | 'filled-success' | 'waiting'

type FooterNav = Pick<LessonNavState, 'isLastStep' | 'stepCompleted' | 'checkDisabled' | 'checkResult' | 'continueLocked'>

export type FooterAction = {
  variant: FooterVariant
  label: string
  showContinue: boolean
  disabled: boolean
}

export function footerAction(
  { isLastStep, stepCompleted, checkDisabled, checkResult, continueLocked }: FooterNav,
  debugMode = false,
): FooterAction {
  const isIncorrect = checkResult === 'incorrect'
  const solved = checkResult === 'correct' || stepCompleted
  const showContinue = debugMode || solved || continueLocked

  const variant: FooterVariant = checkResult === 'correct' ? 'filled-success' : isIncorrect ? 'waiting' : 'filled'

  const label = showContinue
    ? isLastStep
      ? messages.footer.finishLesson
      : messages.footer.continue
    : isIncorrect
      ? messages.footer.changeAnswer
      : messages.footer.checkAnswer

  return {
    variant,
    label,
    showContinue,
    disabled: !debugMode && (isIncorrect || (!solved && (continueLocked || checkDisabled))),
  }
}
