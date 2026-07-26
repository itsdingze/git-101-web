import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { Step, Lesson } from '@/types'
import useProgressStore from '@/stores/progressStore'
import lessons from '@/data/lessons/index'

interface UseSummaryPageResult {
  lesson: Lesson | undefined
  commands: string[]
  nextLesson: Lesson | undefined
}

function extractCommands(steps: readonly Step[]): string[] {
  const commands: string[] = []

  for (const step of steps) {
    if (step.type === 'terminal-exercise') {
      commands.push(step.expectedCommand)
    }
    if (step.type === 'block-exercise') {
      commands.push(step.correctAnswer.join(' '))
    }
  }

  return [...new Set(commands)]
}

export default function useSummaryPage(): UseSummaryPageResult {
  const { lessonId } = useParams()
  const parsedId = parseInt(lessonId ?? '', 10)

  const completeLesson = useProgressStore((s) => s.completeLesson)
  const isStepCompleted = useProgressStore((s) => s.isStepCompleted)

  const lesson = lessons.find((l) => l.id === parsedId)
  const nextLesson = lessons.find((l) => l.id === parsedId + 1)

  const commands = useMemo(() => {
    if (!lesson) return []
    return extractCommands(lesson.steps)
  }, [lesson])

  // Guarded so landing on this URL directly does not credit unfinished work
  useEffect(() => {
    if (!lesson) return
    if (lesson.steps.every((step) => isStepCompleted(parsedId, step.id))) {
      completeLesson(parsedId)
    }
  }, [lesson, parsedId, completeLesson, isStepCompleted])

  return { lesson, commands, nextLesson }
}
