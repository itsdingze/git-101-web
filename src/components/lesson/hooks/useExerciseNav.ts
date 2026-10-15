import { useEffect, useRef } from 'react'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'

interface UseExerciseNavOptions {
  solved: boolean
  checkFn?: () => boolean | undefined
  checkDisabled?: boolean
  holdIncorrect?: boolean
  answerKey?: string
}

export function useExerciseNav({
  solved,
  checkFn,
  checkDisabled,
  holdIncorrect = false,
  answerKey,
}: UseExerciseNavOptions): void {
  const { registerCheck, clearCheck, reportStepSolved, clearCheckResult } = useLessonNav()
  const checkFnRef = useRef(checkFn)

  useEffect(() => {
    checkFnRef.current = checkFn
  }, [checkFn])

  useEffect(() => {
    if (solved) {
      clearCheck()
      reportStepSolved(true)
    } else {
      reportStepSolved(false)
      registerCheck(() => checkFnRef.current?.(), checkDisabled, holdIncorrect)
    }
    return clearCheck
  }, [solved, checkDisabled, holdIncorrect, registerCheck, clearCheck, reportStepSolved])

  useEffect(() => {
    if (holdIncorrect && !solved) clearCheckResult()
  }, [answerKey, holdIncorrect, solved, clearCheckResult])
}
