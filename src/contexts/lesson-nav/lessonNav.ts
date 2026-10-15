export type LessonNavState = {
  showLessonNav: boolean
  current: number
  total: number
  onPrev: (() => void) | null
  onNext: (() => void) | null
  canGoPrev: boolean
  isLastStep: boolean
  stepCompleted: boolean
  checkDisabled: boolean
  checkResult: 'correct' | 'incorrect' | null
  continueLocked: boolean
}

type LessonNavActions = {
  setLessonNav: (values: Partial<LessonNavState>) => void
  clearLessonNav: () => void
  registerCheck: (checkFn: () => boolean | undefined, disabled?: boolean, holdIncorrect?: boolean) => void
  clearCheck: () => void
  triggerCheck: () => void
  reportStepSolved: (isSolved: boolean) => void
  lockContinue: (locked: boolean) => void
  clearCheckResult: () => void
}

export type LessonNavContextValue = LessonNavState & LessonNavActions
