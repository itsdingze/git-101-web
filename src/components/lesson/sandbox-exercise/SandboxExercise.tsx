import { useEffect, useState } from 'react'
import type { SandboxExerciseStep } from '@/types'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import useProgressStore from '@/stores/progressStore'
import useContinueGate from '@/hooks/useContinueGate'
import useSandboxExercise from './hooks/useSandboxExercise'
import useExerciseSeed from './hooks/useExerciseSeed'
import useIdentityCapture from './hooks/useIdentityCapture'
import SandboxTerminal from './components/SandboxTerminal'
import { hintCoach } from './coachLines'

interface SandboxExerciseProps {
  step: SandboxExerciseStep
  lessonId: number
}

type HintProgress = {
  goalId: string
  next: number
}

export default function SandboxExercise({ step, lessonId }: SandboxExerciseProps) {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])
  const seed = useExerciseSeed(step.seed)

  const { ready, running, lines, prompt, snapshot, allCompleted, activeGoalIndex, submit, say, reset } =
    useSandboxExercise(step, seed, lessonId)

  useIdentityCapture(seed, snapshot)

  const [hintProgress, setHintProgress] = useState<HintProgress>({ goalId: '', next: 0 })

  const solved = allCompleted || isCompleted
  const activeGoal = step.goals[activeGoalIndex]

  useEffect(() => {
    if (allCompleted && !isCompleted) completeStep(lessonId, step.id)
  }, [allCompleted, isCompleted, completeStep, lessonId, step.id])

  useContinueGate(solved)

  function handleHint() {
    if (!activeGoal) return

    const index = hintProgress.goalId === activeGoal.id ? hintProgress.next : 0
    say([hintCoach(activeGoal, index)])
    setHintProgress({ goalId: activeGoal.id, next: index + 1 })
  }

  function handleReset() {
    setHintProgress({ goalId: '', next: 0 })
    reset()
  }

  return (
    <div className="space-y-6">
      <InlineMarkdown as="h2" className="text-xl font-semibold text-text-primary tracking-tight" value={step.title} />

      <InlineMarkdown className="text-sm text-text-secondary leading-relaxed" value={step.brief} />

      {isCompleted && !allCompleted && (
        <p className="text-sm text-text-muted">You finished this exercise before. Replay it, or press Continue.</p>
      )}

      <SandboxTerminal
        lines={lines}
        prompt={prompt}
        disabled={!ready || running}
        onSubmit={submit}
      />

      <ExerciseControls
        hints={activeGoal?.hints}
        hintIndex={0}
        showHint={false}
        solved={allCompleted}
        onToggleHint={handleHint}
        onReset={handleReset}
      />
    </div>
  )
}
