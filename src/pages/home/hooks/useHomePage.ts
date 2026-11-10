import type { LessonOutline } from '@/types'
import { useProgressStore } from '@/stores/progressStore'
import { lessonOutlines } from '@/data/lessons/outlines'
import { courseProgress, lessonStatuses, type LessonStatus } from '@/pages/home/courseProgress'

interface UseHomePageResult {
  lessons: readonly LessonStatus[]
  nextLesson: LessonOutline | undefined
  hasStarted: boolean
}

export function useHomePage(): UseHomePageResult {
  const completedLessons = useProgressStore((s) => s.completedLessons)

  return { lessons: lessonStatuses(lessonOutlines, completedLessons), ...courseProgress(lessonOutlines, completedLessons) }
}
