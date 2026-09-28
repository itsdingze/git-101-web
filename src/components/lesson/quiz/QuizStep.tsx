import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { QuizStep as QuizStepType } from '@/types'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import FeedbackPanel from '@/components/ui/FeedbackPanel'
import seededShuffle from '@/lib/seededShuffle'

const GENERIC_WRONG = 'Not quite. Read the options again and look for the one that matches what Git actually does.'

interface QuizStepProps {
  step: QuizStepType
  lessonId: number
}

export default function QuizStep({ step, lessonId }: QuizStepProps) {
  const prefersReduced = useReducedMotion()
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const slots = useMemo(
    () =>
      seededShuffle(step.options.length, step.id).flatMap((sourceIndex) => {
        const option = step.options[sourceIndex]
        return option ? [{ sourceIndex, option }] : []
      }),
    [step.options, step.id]
  )
  const correctSlot = slots.findIndex((slot) => slot.sourceIndex === step.correctIndex)

  const [selected, setSelected] = useState<number | null>(isCompleted ? correctSlot : null)
  const [wrongFeedback, setWrongFeedback] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  function handleSelect(slot: number) {
    if (slot === selected) return
    setSelected(slot)
    setWrongFeedback(null)
  }

  function handleCheck() {
    const picked = selected === null ? undefined : slots[selected]
    if (!picked) return false

    if (picked.sourceIndex === step.correctIndex) {
      completeStep(lessonId, step.id)
      setWrongFeedback(null)
      return true
    }

    setWrongFeedback(picked.option.whyWrong ?? GENERIC_WRONG)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    return false
  }

  useExerciseNav({
    solved: isCompleted,
    checkFn: handleCheck,
    checkDisabled: selected === null,
    answerKey: String(selected),
  })

  return (
    <div className="space-y-6">
      <InlineMarkdown
        as="h2"
        className="text-base font-semibold text-text-primary leading-snug"
        value={step.question}
      />

      <motion.div
        className="space-y-3"
        animate={shake && !prefersReduced ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {slots.map(({ option }, slot) => {
          let styles = 'border-border bg-bg-primary'

          if (isCompleted && slot === correctSlot) {
            styles = 'border-accent-green bg-accent-green/5'
          } else if (slot === selected) {
            styles = wrongFeedback
              ? 'border-accent-red bg-accent-red/5'
              : 'border-accent-blue-light bg-accent-blue-tint'
          }

          return (
            <button
              key={option.text}
              type="button"
              onClick={() => handleSelect(slot)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm leading-relaxed
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${isCompleted ? 'cursor-default' : 'cursor-pointer'} ${styles} ${
                !isCompleted ? 'hover:border-text-muted' : ''
              }`}
              disabled={isCompleted}
            >
              <InlineMarkdown as="span" className="text-text-secondary" value={option.text} />
            </button>
          )
        })}
      </motion.div>

      <div role="status" aria-live="polite">
        {!isCompleted && wrongFeedback && <FeedbackPanel tone="wrong" message={wrongFeedback} />}
        {isCompleted && <FeedbackPanel tone="right" message={step.explanation} />}
      </div>
    </div>
  )
}
