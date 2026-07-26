import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { LessonNavContext } from './lessonNavCtx'
import type { LessonNavState } from '@/types'

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
}

export function LessonNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<LessonNavState>(defaultNav)
  const checkFnRef = useRef<(() => boolean | undefined) | null>(null)
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setLessonNav = useCallback((values: Partial<LessonNavState>) => {
    setNav((prev) => ({ ...prev, showLessonNav: true, ...values }))
  }, [])

  const clearCheckResult = useCallback(() => {
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
    setNav((prev) => ({ ...prev, checkResult: null }))
  }, [])

  const clearLessonNav = useCallback(() => {
    checkFnRef.current = null
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
    setNav(defaultNav)
  }, [])

  const registerCheck = useCallback((checkFn: () => boolean | undefined, disabled = false) => {
    checkFnRef.current = checkFn
    setNav((prev) => ({ ...prev, checkDisabled: disabled }))
  }, [])

  const clearCheck = useCallback(() => {
    checkFnRef.current = null
    setNav((prev) => ({ ...prev, checkDisabled: false }))
  }, [])

  const triggerCheck = useCallback(() => {
    const result = checkFnRef.current?.()
    if (result === true) {
      setNav((prev) => ({ ...prev, checkResult: 'correct' }))
    } else if (result === false) {
      setNav((prev) => ({ ...prev, checkResult: 'incorrect' }))
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
      revertTimerRef.current = setTimeout(() => {
        setNav((prev) => ({ ...prev, checkResult: null }))
      }, 600)
    }
  }, [])

  const reportStepSolved = useCallback((isSolved: boolean) => {
    setNav((prev) => ({ ...prev, stepCompleted: isSolved }))
  }, [])

  const value = useMemo(
    () => ({ ...nav, setLessonNav, clearLessonNav, registerCheck, clearCheck, triggerCheck, reportStepSolved, clearCheckResult }),
    [nav, setLessonNav, clearLessonNav, registerCheck, clearCheck, triggerCheck, reportStepSolved, clearCheckResult]
  )

  return (
    <LessonNavContext value={value}>
      {children}
    </LessonNavContext>
  )
}
