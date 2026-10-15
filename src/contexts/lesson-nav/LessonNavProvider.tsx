import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { LessonNavContext } from './lessonNavContext'
import { checkOutcome } from './checkOutcome'
import type { LessonNavState } from './lessonNav'

const defaultNav: LessonNavState = {
  showLessonNav: false,
  current: 0,
  total: 0,
  onPrev: null,
  onNext: null,
  canGoPrev: false,
  isLastStep: false,
  stepCompleted: false,
  checkDisabled: false,
  checkResult: null,
  continueLocked: false,
}

export function LessonNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<LessonNavState>(defaultNav)
  const checkFnRef = useRef<(() => boolean | undefined) | null>(null)
  const holdIncorrectRef = useRef(false)

  const setLessonNav = useCallback((values: Partial<LessonNavState>) => {
    setNav((prev) => ({ ...prev, showLessonNav: true, ...values }))
  }, [])

  const clearCheckResult = useCallback(() => {
    setNav((prev) => ({ ...prev, checkResult: null }))
  }, [])

  const clearLessonNav = useCallback(() => {
    checkFnRef.current = null
    setNav(defaultNav)
  }, [])

  const registerCheck = useCallback(
    (checkFn: () => boolean | undefined, disabled = false, holdIncorrect = false) => {
      checkFnRef.current = checkFn
      holdIncorrectRef.current = holdIncorrect
      setNav((prev) => ({ ...prev, checkDisabled: disabled }))
    },
    []
  )

  const clearCheck = useCallback(() => {
    checkFnRef.current = null
    holdIncorrectRef.current = false
    setNav((prev) => ({ ...prev, checkDisabled: false }))
  }, [])

  const triggerCheck = useCallback(() => {
    const outcome = checkOutcome(checkFnRef.current?.(), holdIncorrectRef.current)
    if (outcome) setNav((prev) => ({ ...prev, checkResult: outcome }))
  }, [])

  const reportStepSolved = useCallback((isSolved: boolean) => {
    setNav((prev) => ({ ...prev, stepCompleted: isSolved }))
  }, [])

  const lockContinue = useCallback((locked: boolean) => {
    setNav((prev) => ({ ...prev, continueLocked: locked }))
  }, [])

  const value = useMemo(
    () => ({
      ...nav,
      setLessonNav,
      clearLessonNav,
      registerCheck,
      clearCheck,
      triggerCheck,
      reportStepSolved,
      clearCheckResult,
      lockContinue,
    }),
    [nav, setLessonNav, clearLessonNav, registerCheck, clearCheck, triggerCheck, reportStepSolved, clearCheckResult, lockContinue]
  )

  return (
    <LessonNavContext value={value}>
      {children}
    </LessonNavContext>
  )
}
