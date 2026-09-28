import { useEffect, useRef } from 'react'
import { useLessonNav } from './useLessonNav'

interface UseExerciseNavOptions {
  solved: boolean
  checkFn?: () => boolean | undefined
  checkDisabled?: boolean
  answerKey?: string
}

export default function useExerciseNav({ solved, checkFn, checkDisabled, answerKey }: UseExerciseNavOptions): void {
  const { registerCheck, clearCheck, reportStepSolved, clearCheckResult } = useLessonNav()
  const checkFnRef = useRef(checkFn)
  const holdIncorrect = answerKey !== undefined

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
    if (answerKey !== undefined && !solved) clearCheckResult()
  }, [answerKey, solved, clearCheckResult])
}
