import { useState } from 'react'
import { useProgressStore } from '@/stores/progressStore'
import { useExerciseNav } from '@/components/lesson/hooks/useExerciseNav'
import { useShake } from '@/components/lesson/hooks/useShake'
import { hintAt } from '@/components/lesson/model/hintAt'
import type { BlockExerciseStep } from '@/types'
import { blockFeedback } from '@/components/lesson/block-exercise/model/blockFeedback'
import { answerKeyOf, changedAnswer, type CheckedAnswer } from '@/components/lesson/block-exercise/model/checkedAnswer'
import { hintAfterWrongCheck } from '@/components/lesson/block-exercise/model/hintProgress'

type AnswerUpdate = (answer: readonly string[]) => readonly string[]

export interface BlockAnswer {
  answer: readonly string[]
  solved: boolean
  feedback: string | null
  shaking: boolean
  hintOpen: boolean
  visibleHint: string | null
  changeAnswer: (update: AnswerUpdate) => void
  add: (block: string) => void
  remove: (block: string) => void
  toggleHint: () => void
  reset: () => void
}

const EMPTY: CheckedAnswer = { answer: [], feedback: null }

export function useBlockAnswer(step: BlockExerciseStep, lessonId: number): BlockAnswer {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => s.isStepCompleted(lessonId, step.id))
  const [checked, setChecked] = useState<CheckedAnswer>(() =>
    isCompleted ? { answer: step.correctAnswer, feedback: null } : EMPTY,
  )
  const [solved, setSolved] = useState(isCompleted)
  const [hintOpen, setHintOpen] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const { shaking, shake, stop } = useShake()
  const { answer, feedback } = checked
  const hints = step.hints ?? []

  function changeAnswer(update: AnswerUpdate) {
    if (solved) return
    setChecked((current) => changedAnswer(current, update(current.answer)))
  }

  function handleCheck() {
    const message = blockFeedback(answer, step)

    if (message === null) {
      setSolved(true)
      setChecked({ answer, feedback: null })
      completeStep(lessonId, step.id)
      return true
    }

    setChecked({ answer, feedback: message })
    shake()
    setHintIndex((index) => hintAfterWrongCheck(index, hints.length, hintOpen))
    return false
  }

  useExerciseNav({
    solved,
    checkFn: handleCheck,
    checkDisabled: answer.length === 0,
    holdIncorrect: true,
    answerKey: answerKeyOf(answer),
  })

  function reset() {
    setChecked(EMPTY)
    setSolved(false)
    setHintOpen(false)
    setHintIndex(0)
    stop()
  }

  return {
    answer,
    solved,
    feedback,
    shaking,
    hintOpen,
    visibleHint: hintOpen && !solved && hints.length > 0 ? hintAt(hints, hintIndex) : null,
    changeAnswer,
    add: (block) => changeAnswer((current) => [...current, block]),
    remove: (block) => changeAnswer((current) => current.filter((b) => b !== block)),
    toggleHint: () => setHintOpen((open) => !open),
    reset,
  }
}
