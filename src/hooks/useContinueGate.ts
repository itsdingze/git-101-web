import { useEffect } from 'react'
import { useLessonNav } from './useLessonNav'

export default function useContinueGate(solved: boolean): void {
  const { reportStepSolved, lockContinue } = useLessonNav()

  useEffect(() => {
    reportStepSolved(solved)
    lockContinue(!solved)
    return () => lockContinue(false)
  }, [solved, reportStepSolved, lockContinue])
}
