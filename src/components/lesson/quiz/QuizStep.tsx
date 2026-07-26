import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { QuizStep as QuizStepType } from '@/types'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'

interface QuizStepProps {
  step: QuizStepType
  lessonId: number
}

export default function QuizStep({ step, lessonId }: QuizStepProps) {
  const prefersReduced = useReducedMotion()
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const [selected, setSelected] = useState<number | null>(isCompleted ? step.correctIndex : null)
  const [shake, setShake] = useState(false)

  function handleCheck() {
    if (selected === null) return false
    if (selected === step.correctIndex) {
      completeStep(lessonId, step.id)
      return true
    }
    setShake(true)
    setTimeout(() => setShake(false), 500)
    return false
  }

  useExerciseNav({ solved: isCompleted, checkFn: handleCheck, checkDisabled: selected === null })

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary leading-snug">{step.question}</h2>

      <motion.div
        className="space-y-3"
        animate={shake && !prefersReduced ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {step.options.map((option, i) => {
          let styles = 'border-border bg-bg-card'

          if (isCompleted && i === step.correctIndex) {
            styles = 'border-accent-green bg-accent-green/5'
          } else if (i === selected) {
            styles = shake ? 'border-accent-red bg-accent-red/5' : 'border-text-primary bg-bg-secondary'
          }

          return (
            <button
              key={option}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm leading-relaxed
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${isCompleted ? 'cursor-default' : 'cursor-pointer'} ${styles} ${
                !isCompleted ? 'hover:border-text-muted' : ''
              }`}
              disabled={isCompleted}
            >
              <span className="text-text-secondary">{option}</span>
            </button>
          )
        })}
      </motion.div>

      {isCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm leading-relaxed bg-accent-green/5 border border-accent-green/20">
          <CheckCircle size={18} className="text-accent-green shrink-0" />
          <p className="text-text-secondary">{step.explanation}</p>
        </div>
      )}
    </div>
  )
}
