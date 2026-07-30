import { useState, useCallback, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lesson, Step } from '@/types'
import useProgressStore from '@/stores/progressStore'
import lessons from '@/data/lessons/index'
import { useLessonNav } from '@/hooks/useLessonNav'

interface UseLessonPageResult {
  lesson: Lesson | undefined
  step: Step | undefined
  currentStepIndex: number
  parsedId: number
}

export default function useLessonPage(lessonId: string | undefined): UseLessonPageResult {
  const navigate = useNavigate()
  const parsedId = parseInt(lessonId ?? '', 10)

  const getCurrentStep = useProgressStore((s) => s.getCurrentStep)
  const setCurrentStep = useProgressStore((s) => s.setCurrentStep)
  const isStepCompleted = useProgressStore((s) => s.isStepCompleted)
  const isLessonCompleted = useProgressStore((s) => s.isLessonCompleted)
  const completeStep = useProgressStore((s) => s.completeStep)

  const lesson = lessons.find((l) => l.id === parsedId)

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (isLessonCompleted(parsedId)) return 0
    return getCurrentStep(parsedId)
  })

  const { setLessonNav, clearLessonNav, clearCheckResult } = useLessonNav()

  const handleStepComplete = useCallback(() => {
    if (!lesson) return

    const step = lesson.steps[currentStepIndex]
    if (!step) return
    completeStep(parsedId, step.id)

    const nextIndex = currentStepIndex + 1
    if (nextIndex >= lesson.steps.length) {
      void navigate(`/lesson/${parsedId}/summary`)
    } else {
      setCurrentStepIndex(nextIndex)
      setCurrentStep(parsedId, nextIndex)
    }
  }, [lesson, currentStepIndex, parsedId, completeStep, navigate, setCurrentStep])

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      setCurrentStep(parsedId, prevIndex)
    }
  }, [currentStepIndex, parsedId, setCurrentStep])

  useLayoutEffect(() => {
    if (!lesson) {
      clearLessonNav()
      return clearLessonNav
    }

    clearCheckResult()

    const step = lesson.steps[currentStepIndex]
    if (!step) return clearLessonNav
    const alreadySolved = step.type === 'reading' || isStepCompleted(parsedId, step.id)

    setLessonNav({
      current: currentStepIndex,
      total: lesson.steps.length,
      onPrev: handlePrev,
      onNext: handleStepComplete,
      canGoPrev: currentStepIndex > 0,
      isLastStep: currentStepIndex >= lesson.steps.length - 1,
      stepCompleted: alreadySolved,
    })
    return clearLessonNav
  }, [lesson, currentStepIndex, parsedId, isStepCompleted, handlePrev, handleStepComplete, setLessonNav, clearLessonNav, clearCheckResult])

  const step = lesson?.steps[currentStepIndex]

  return { lesson, step, currentStepIndex, parsedId }
}
