import type { Lesson } from '@/types'

interface SavedProgress {
  lessonCompleted: boolean
  savedStep: number
}

export function initialStepIndex(lesson: Lesson | undefined, { lessonCompleted, savedStep }: SavedProgress): number {
  if (!lesson || lessonCompleted) return 0
  return Math.min(savedStep, lesson.steps.length - 1)
}
