import type { Lesson } from '@/types'

interface CourseProgress {
  nextLesson: Lesson | undefined
  hasStarted: boolean
}

export interface LessonStatus {
  lesson: Lesson
  isCompleted: boolean
  isCurrent: boolean
}

export function lessonStatuses(lessons: readonly Lesson[], completedLessons: readonly number[]): LessonStatus[] {
  const { nextLesson } = courseProgress(lessons, completedLessons)
  return lessons.map((lesson) => ({
    lesson,
    isCompleted: completedLessons.includes(lesson.id),
    isCurrent: lesson.id === nextLesson?.id,
  }))
}

export function courseProgress(
  lessons: readonly Lesson[],
  completedLessons: readonly number[],
): CourseProgress {
  return {
    nextLesson: lessons.find((lesson) => !completedLessons.includes(lesson.id)),
    hasStarted: completedLessons.length > 0,
  }
}
