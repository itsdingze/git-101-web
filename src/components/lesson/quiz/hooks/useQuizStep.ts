import { type KeyboardEvent, useMemo, useRef, useState } from 'react'
import type { QuizStep } from '@/types'
import { useProgressStore } from '@/stores/progressStore'
import { useExerciseNav } from '@/components/lesson/hooks/useExerciseNav'
import { useShake } from '@/components/lesson/hooks/useShake'
import { seededShuffle } from '@/components/lesson/model/seededShuffle'
import { slotTone, type SlotTone } from '@/components/lesson/quiz/model/slotTone'
import { radioKeyTarget } from '@/components/lesson/quiz/model/radioKeys'
import { messages } from '@/messages/en'

type QuizOption = QuizStep['options'][number]

interface QuizSlot {
  option: QuizOption
  tone: SlotTone
  checked: boolean
  tabIndex: 0 | -1
}

interface QuizStepState {
  slots: readonly QuizSlot[]
  completed: boolean
  feedback: string | null
  shaking: boolean
  select: (slot: number) => void
  pressKey: (slot: number, event: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => void
  slotRef: (slot: number) => (element: HTMLButtonElement | null) => void
}

export function useQuizStep(step: QuizStep, lessonId: number): QuizStepState {
  const completeStep = useProgressStore((s) => s.completeStep)
  const completed = useProgressStore((s) => s.isStepCompleted(lessonId, step.id))
  const options = useMemo(() => seededShuffle(step.options, step.id), [step.options, step.id])
  const correctSlot = options.findIndex((option) => option === step.options[step.correctIndex])

  const [selected, setSelected] = useState<number | null>(completed ? correctSlot : null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { shaking, shake } = useShake()
  const slotElements = useRef<(HTMLButtonElement | null)[]>([])

  function select(slot: number) {
    if (completed || slot === selected) return
    setSelected(slot)
    setFeedback(null)
  }

  function handleCheck() {
    const picked = selected === null ? undefined : options[selected]
    if (!picked) return false

    if (selected === correctSlot) {
      completeStep(lessonId, step.id)
      setFeedback(null)
      return true
    }

    setFeedback(picked.whyWrong ?? messages.quiz.genericWrong)
    shake()
    return false
  }

  useExerciseNav({
    solved: completed,
    checkFn: handleCheck,
    checkDisabled: selected === null,
    answerKey: String(selected),
  })

  function pressKey(slot: number, event: Pick<KeyboardEvent, 'key' | 'preventDefault'>) {
    const target = radioKeyTarget(event.key, slot, options.length)
    if (target === null) return
    event.preventDefault()
    select(target)
    slotElements.current[target]?.focus()
  }

  const focusable = selected ?? 0
  const quizState = { selected, correctSlot, completed, wrong: feedback !== null }

  return {
    slots: options.map((option, slot) => ({
      option,
      tone: slotTone(slot, quizState),
      checked: slot === selected,
      tabIndex: slot === focusable ? 0 : -1,
    })),
    completed,
    feedback: completed ? null : feedback,
    shaking,
    select,
    pressKey,
    slotRef: (slot) => (element) => {
      slotElements.current[slot] = element
    },
  }
}
