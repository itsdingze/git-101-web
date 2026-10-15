import { useEffect } from 'react'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'

export function useContinueGate(solved: boolean): void {
  const { reportStepSolved, lockContinue } = useLessonNav()

  useEffect(() => {
    reportStepSolved(solved)
    lockContinue(!solved)
    return () => lockContinue(false)
  }, [solved, reportStepSolved, lockContinue])
}
