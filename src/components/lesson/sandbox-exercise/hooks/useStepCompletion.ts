import { useEffect } from 'react'
import { useProgressStore } from '@/stores/progressStore'

export function useStepCompletion(lessonId: number, stepId: string, allCompleted: boolean): boolean {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => s.isStepCompleted(lessonId, stepId))

  useEffect(() => {
    if (allCompleted && !isCompleted) completeStep(lessonId, stepId)
  }, [allCompleted, isCompleted, completeStep, lessonId, stepId])

  return isCompleted
}
