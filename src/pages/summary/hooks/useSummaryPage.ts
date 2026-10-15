import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { Lesson } from '@/types'
import { useProgressStore } from '@/stores/progressStore'
import { lessons } from '@/data/lessons/index'
import { finishedEveryLesson, finishedEveryStep } from '@/pages/summary/lessonCompletion'

interface UseSummaryPageResult {
  lesson: Lesson | undefined
  lessonFinished: boolean
  nextLesson: Lesson | undefined
  courseComplete: boolean
  completedCount: number
  totalCount: number
}

export function useSummaryPage(): UseSummaryPageResult {
  const { lessonId } = useParams()
  const parsedId = parseInt(lessonId ?? '', 10)

  const completeLesson = useProgressStore((s) => s.completeLesson)
  const isStepCompleted = useProgressStore((s) => s.isStepCompleted)
  const completedLessons = useProgressStore((s) => s.completedLessons)

  const lessonIndex = lessons.findIndex((candidate) => candidate.id === parsedId)
  const lesson = lessons[lessonIndex]
  const nextLesson = lessonIndex < 0 ? undefined : lessons[lessonIndex + 1]

  const stepsFinished = lesson !== undefined && finishedEveryStep(lesson, isStepCompleted)

  useEffect(() => {
    if (lesson && stepsFinished) completeLesson(lesson.id)
  }, [lesson, stepsFinished, completeLesson])

  return {
    lesson,
    lessonFinished: stepsFinished || (lesson !== undefined && completedLessons.includes(lesson.id)),
    nextLesson,
    courseComplete: lesson !== undefined && finishedEveryLesson(lessons, completedLessons),
    completedCount: completedLessons.length,
    totalCount: lessons.length,
  }
}
