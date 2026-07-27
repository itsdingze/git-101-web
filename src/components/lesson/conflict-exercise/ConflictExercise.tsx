import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { ConflictExerciseStep } from '@/types'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import ExerciseControls from '@/components/lesson/ExerciseControls'

type Resolution = 'ours' | 'theirs' | 'both'

interface ConflictExerciseProps {
  step: ConflictExerciseStep
  lessonId: number
}

function resolveContent(step: ConflictExerciseStep, resolution: Resolution): string {
  switch (resolution) {
    case 'ours':
      return step.oursContent
    case 'theirs':
      return step.theirsContent
    case 'both':
      return step.oursContent + '\n' + step.theirsContent
  }
}

export default function ConflictExercise({ step, lessonId }: ConflictExerciseProps) {
  const prefersReduced = useReducedMotion()
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const [resolution, setResolution] = useState<Resolution | null>(() => {
    if (!isCompleted) return null
    const first = step.acceptableResolutions[0]?.trim()
    if (first === step.oursContent.trim()) return 'ours'
    if (first === step.theirsContent.trim()) return 'theirs'
    if (first === (step.oursContent + '\n' + step.theirsContent).trim()) return 'both'
    return 'theirs'
  })
  const [shake, setShake] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)

  function handleCheck() {
    if (resolution === null) return false
    const resolved = resolveContent(step, resolution).trim()
    const match = step.acceptableResolutions.some((r) => r.trim() === resolved)
    if (match) {
      completeStep(lessonId, step.id)
      return true
    }
    setShake(true)
    setHintIndex((prev) => Math.min(prev + 1, (step.hints?.length ?? 1) - 1))
    setTimeout(() => setShake(false), 500)
    return false
  }

  function handleReset() {
    setResolution(null)
    setShake(false)
    setHintIndex(0)
    setShowHint(false)
  }

  function handleToggleHint() {
    setShowHint((prev) => !prev)
  }

  useExerciseNav({ solved: isCompleted, checkFn: handleCheck, checkDisabled: resolution === null })

  const buttons: { key: Resolution; label: string; preview: string; activeColor: string }[] = [
    // Labels mirror the lesson's wording: "ours" is the current branch, "theirs" is incoming
    { key: 'ours', label: 'Keep ours (current)', preview: step.oursContent, activeColor: 'border-accent-green bg-accent-green/5' },
    { key: 'theirs', label: 'Keep theirs (incoming)', preview: step.theirsContent, activeColor: 'border-accent-blue bg-accent-blue/5' },
    { key: 'both', label: 'Keep both', preview: step.oursContent + '\n' + step.theirsContent, activeColor: 'border-text-primary bg-bg-secondary' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary leading-snug">{step.prompt}</h2>

      <div>
        <div className="text-xs font-mono text-text-muted mb-2">{step.fileName}</div>
        <pre className="bg-code-bg rounded-xl px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
          {step.surroundingBefore && (
            <span className="text-code-text">{step.surroundingBefore + '\n'}</span>
          )}
          <span className="text-text-muted">{'<<<<<<< ' + step.oursLabel + '\n'}</span>
          <span className="text-accent-green">{step.oursContent + '\n'}</span>
          <span className="text-text-muted">{'=======\n'}</span>
          <span className="text-accent-blue">{step.theirsContent + '\n'}</span>
          <span className="text-text-muted">{'>>>>>>> ' + step.theirsLabel}</span>
          {step.surroundingAfter && (
            <span className="text-code-text">{'\n' + step.surroundingAfter}</span>
          )}
        </pre>
      </div>

      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        animate={shake && !prefersReduced ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {buttons.map(({ key, label, preview, activeColor }) => {
          let styles = 'border-border bg-bg-primary'
          if (isCompleted && resolution === key) {
            styles = activeColor
          } else if (!isCompleted && resolution === key) {
            styles = shake
              ? 'border-accent-red bg-accent-red/5'
              : 'border-accent-blue-light bg-accent-blue-tint'
          }

          return (
            <button
              key={key}
              onClick={() => setResolution(key)}
              disabled={isCompleted}
              className={`flex-1 flex flex-col items-start text-left px-4 py-3 rounded-xl border transition-colors text-sm
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${styles}
                ${!isCompleted ? 'cursor-pointer hover:border-text-muted' : 'cursor-default'}
              `}
            >
              <span className="font-medium text-text-primary">{label}</span>
              <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">{preview}</p>
            </button>
          )
        })}
      </motion.div>

      {isCompleted && resolution && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-accent-green font-medium">
            <CheckCircle size={16} />
            Resolved
          </div>
          <div className="text-xs font-mono text-text-muted mb-1">{step.fileName}</div>
          <pre className="bg-code-bg rounded-xl px-5 py-4 font-mono text-xs leading-relaxed border border-accent-green/30 overflow-x-auto">
            {step.surroundingBefore && (
              <span className="text-code-text">{step.surroundingBefore + '\n'}</span>
            )}
            <span className="text-code-text">{resolveContent(step, resolution)}</span>
            {step.surroundingAfter && (
              <span className="text-code-text">{'\n' + step.surroundingAfter}</span>
            )}
          </pre>
        </div>
      )}

      <ExerciseControls
        hints={step.hints}
        hintIndex={hintIndex}
        showHint={showHint}
        solved={isCompleted}
        onToggleHint={handleToggleHint}
        onReset={handleReset}
      />
    </div>
  )
}
