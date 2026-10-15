import type { Lesson } from '@/types'
import { useProgressStore } from '@/stores/progressStore'
import { lessons } from '@/data/lessons/index'
import { courseProgress, lessonStatuses, type LessonStatus } from '@/pages/home/courseProgress'

interface UseHomePageResult {
  lessons: readonly LessonStatus[]
  nextLesson: Lesson | undefined
  hasStarted: boolean
}

export function useHomePage(): UseHomePageResult {
  const completedLessons = useProgressStore((s) => s.completedLessons)

  return { lessons: lessonStatuses(lessons, completedLessons), ...courseProgress(lessons, completedLessons) }
}
