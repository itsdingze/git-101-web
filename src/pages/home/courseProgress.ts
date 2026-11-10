import type { LessonOutline } from '@/types'

interface CourseProgress {
  nextLesson: LessonOutline | undefined
  hasStarted: boolean
}

export interface LessonStatus {
  lesson: LessonOutline
  isCompleted: boolean
  isCurrent: boolean
}

export function lessonStatuses(lessons: readonly LessonOutline[], completedLessons: readonly number[]): LessonStatus[] {
  const { nextLesson } = courseProgress(lessons, completedLessons)
  return lessons.map((lesson) => ({
    lesson,
    isCompleted: completedLessons.includes(lesson.id),
    isCurrent: lesson.id === nextLesson?.id,
  }))
}

export function courseProgress(
  lessons: readonly LessonOutline[],
  completedLessons: readonly number[],
): CourseProgress {
  return {
    nextLesson: lessons.find((lesson) => !completedLessons.includes(lesson.id)),
    hasStarted: completedLessons.length > 0,
  }
}
