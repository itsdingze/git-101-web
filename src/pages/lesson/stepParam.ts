import type { Lesson } from '@/types'

export const STEP_PARAM = 'step'

const STEP_NUMBER = /^[1-9]\d*$/

interface LessonProgress {
  lessonCompleted: boolean
  savedStep: number
  isStepCompleted: (stepId: string) => boolean
}

export function furthestReachableStep(lesson: Lesson | undefined, { lessonCompleted, savedStep, isStepCompleted }: LessonProgress): number {
  if (!lesson) return 0
  const lastStep = lesson.steps.length - 1
  if (lessonCompleted) return lastStep

  const firstIncomplete = lesson.steps.findIndex((step) => !isStepCompleted(step.id))
  const nextToComplete = firstIncomplete === -1 ? lastStep : firstIncomplete
  return Math.min(Math.max(nextToComplete, savedStep), lastStep)
}

export function resolveStepIndex(value: string | null, entryStep: number, furthestStep: number): number {
  if (value === null) return entryStep
  if (!STEP_NUMBER.test(value)) return furthestStep
  return Math.min(Number(value) - 1, furthestStep)
}

export function stepParamValue(stepIndex: number): string {
  return String(stepIndex + 1)
}
