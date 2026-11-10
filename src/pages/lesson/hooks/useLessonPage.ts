import { useState, useCallback, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Lesson, Step } from '@/types'
import { useProgressStore } from '@/stores/progressStore'
import { lessonById } from '@/data/lessons/index'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { initialStepIndex } from '@/pages/lesson/initialStepIndex'
import { furthestReachableStep, resolveStepIndex, STEP_PARAM, stepParamValue } from '@/pages/lesson/stepParam'
import { useFooterActivationGate } from './useFooterActivationGate'

interface UseLessonPageResult {
  lesson: Lesson | undefined
  step: Step | undefined
  currentStepIndex: number
  parsedId: number
}

export function useLessonPage(lessonId: string | undefined): UseLessonPageResult {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedId = parseInt(lessonId ?? '', 10)

  const getCurrentStep = useProgressStore((s) => s.getCurrentStep)
  const setCurrentStep = useProgressStore((s) => s.setCurrentStep)
  const isStepCompleted = useProgressStore((s) => s.isStepCompleted)
  const isLessonCompleted = useProgressStore((s) => s.isLessonCompleted)
  const completeStep = useProgressStore((s) => s.completeStep)

  const lesson = lessonById(parsedId)

  const furthestStep = useProgressStore((s) =>
    furthestReachableStep(lesson, {
      lessonCompleted: s.isLessonCompleted(parsedId),
      savedStep: s.getCurrentStep(parsedId),
      isStepCompleted: (stepId) => s.isStepCompleted(parsedId, stepId),
    }),
  )
  const [entryStep] = useState(() =>
    initialStepIndex(lesson, { lessonCompleted: isLessonCompleted(parsedId), savedStep: getCurrentStep(parsedId) }),
  )
  const stepInAddress = searchParams.get(STEP_PARAM)
  const currentStepIndex = resolveStepIndex(stepInAddress, entryStep, furthestStep)

  const { setLessonNav, clearLessonNav, clearCheckResult, checkResult } = useLessonNav()
  const allowFooterActivation = useFooterActivationGate(`${currentStepIndex}:${checkResult}`)

  const writeStepToAddress = useCallback(
    (stepIndex: number, options?: { replace: boolean }) => {
      setSearchParams((params) => {
        params.set(STEP_PARAM, stepParamValue(stepIndex))
        return params
      }, options)
    },
    [setSearchParams],
  )

  const goToStep = useCallback(
    (stepIndex: number) => {
      setCurrentStep(parsedId, stepIndex)
      writeStepToAddress(stepIndex)
    },
    [parsedId, setCurrentStep, writeStepToAddress],
  )

  const handleStepComplete = useCallback(() => {
    if (!lesson || !allowFooterActivation()) return

    const step = lesson.steps[currentStepIndex]
    if (!step) return
    completeStep(parsedId, step.id)

    const nextIndex = currentStepIndex + 1
    if (nextIndex >= lesson.steps.length) {
      void navigate(`/lesson/${parsedId}/summary`)
    } else {
      goToStep(nextIndex)
    }
  }, [lesson, currentStepIndex, parsedId, completeStep, navigate, goToStep, allowFooterActivation])

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0 && allowFooterActivation()) goToStep(currentStepIndex - 1)
  }, [currentStepIndex, goToStep, allowFooterActivation])

  useEffect(() => {
    if (!lesson || stepInAddress === stepParamValue(currentStepIndex)) return
    writeStepToAddress(currentStepIndex, { replace: true })
  }, [lesson, stepInAddress, currentStepIndex, writeStepToAddress])

  useEffect(() => {
    if (lesson && getCurrentStep(parsedId) !== currentStepIndex) setCurrentStep(parsedId, currentStepIndex)
  }, [lesson, parsedId, currentStepIndex, getCurrentStep, setCurrentStep])

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
      canGoPrev: currentStepIndex > 0,
      isLastStep: currentStepIndex >= lesson.steps.length - 1,
      stepCompleted: alreadySolved,
    })
    return clearLessonNav
  }, [lesson, currentStepIndex, parsedId, isStepCompleted, setLessonNav, clearLessonNav, clearCheckResult])

  useLayoutEffect(() => {
    if (lesson?.steps[currentStepIndex]) setLessonNav({ onPrev: handlePrev, onNext: handleStepComplete })
  }, [lesson, currentStepIndex, handlePrev, handleStepComplete, setLessonNav])

  const step = lesson?.steps[currentStepIndex]

  return { lesson, step, currentStepIndex, parsedId }
}
