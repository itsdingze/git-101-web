import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { Lesson } from '@/types'
import useProgressStore from '@/stores/progressStore'
import lessons from '@/data/lessons/index'
import { recapCommands, recapSkills } from '@/pages/summary/lessonRecap'

interface UseSummaryPageResult {
  lesson: Lesson | undefined
  commands: string[]
  skills: string[]
  nextLesson: Lesson | undefined
  courseComplete: boolean
  completedCount: number
  totalCount: number
}

export default function useSummaryPage(): UseSummaryPageResult {
  const { lessonId } = useParams()
  const parsedId = parseInt(lessonId ?? '', 10)

  const completeLesson = useProgressStore((s) => s.completeLesson)
  const isStepCompleted = useProgressStore((s) => s.isStepCompleted)
  const completedLessons = useProgressStore((s) => s.completedLessons)

  const lesson = lessons.find((l) => l.id === parsedId)
  const nextLesson = lessons.find((l) => l.id === parsedId + 1)

  const commands = useMemo(() => (lesson ? recapCommands(lesson.steps) : []), [lesson])
  const skills = useMemo(() => (lesson ? recapSkills(lesson.steps) : []), [lesson])

  // Guarded so landing on this URL directly does not credit unfinished work
  useEffect(() => {
    if (!lesson) return
    if (lesson.steps.every((step) => isStepCompleted(parsedId, step.id))) {
      completeLesson(parsedId)
    }
  }, [lesson, parsedId, completeLesson, isStepCompleted])

  return {
    lesson,
    commands,
    skills,
    nextLesson,
    courseComplete: lesson !== undefined && completedLessons.length === lessons.length,
    completedCount: completedLessons.length,
    totalCount: lessons.length,
  }
}
