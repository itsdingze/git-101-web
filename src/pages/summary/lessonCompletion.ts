import type { Lesson } from '@/types'

export function finishedEveryStep(
  lesson: Lesson,
  isStepCompleted: (lessonId: number, stepId: string) => boolean,
): boolean {
  return lesson.steps.every((step) => isStepCompleted(lesson.id, step.id))
}

export function finishedEveryLesson(lessons: readonly Lesson[], completedLessons: readonly number[]): boolean {
  return lessons.every((lesson) => completedLessons.includes(lesson.id))
}
