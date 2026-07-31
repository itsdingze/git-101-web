import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import type { SandboxExerciseStep } from '@/types'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import useSandboxExercise from './hooks/useSandboxExercise'
import SandboxTerminal from './components/SandboxTerminal'
import GoalChecklist from './components/GoalChecklist'

interface SandboxExerciseProps {
  step: SandboxExerciseStep
  lessonId: number
}

type HintState = {
  goalId: string
  index: number
  open: boolean
}

export default function SandboxExercise({ step, lessonId }: SandboxExerciseProps) {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const { ready, running, lines, prompt, completedGoals, allCompleted, activeGoalIndex, submit, reset } =
    useSandboxExercise(step)

  const [hintState, setHintState] = useState<HintState>({ goalId: '', index: 0, open: false })

  const solved = allCompleted || isCompleted
  const activeGoal = step.goals[activeGoalIndex]
  const guided = step.mode === 'guided'

  const hintsMatchGoal = activeGoal !== undefined && hintState.goalId === activeGoal.id
  const showHint = hintsMatchGoal && hintState.open
  const hintIndex = hintsMatchGoal ? hintState.index : 0

  useEffect(() => {
    if (allCompleted && !isCompleted) completeStep(lessonId, step.id)
  }, [allCompleted, isCompleted, completeStep, lessonId, step.id])

  useExerciseNav({ solved, checkFn: () => allCompleted })

  function handleToggleHint() {
    if (!activeGoal) return

    setHintState((previous) => {
      const sameGoal = previous.goalId === activeGoal.id
      if (sameGoal && previous.open) return { ...previous, open: false }

      const lastHint = (activeGoal.hints?.length ?? 1) - 1
      return {
        goalId: activeGoal.id,
        index: sameGoal ? Math.min(previous.index + 1, lastHint) : 0,
        open: true,
      }
    })
  }

  function handleReset() {
    setHintState({ goalId: '', index: 0, open: false })
    reset()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary tracking-tight">{step.title}</h2>

      <InlineMarkdown className="text-sm text-text-secondary leading-relaxed" value={step.brief} />

      <div className="rounded-xl border border-border bg-bg-secondary px-5 py-4">
        <GoalChecklist
          goals={step.goals}
          completed={completedGoals}
          activeIndex={activeGoalIndex}
          guided={guided}
        />
      </div>

      {guided && !allCompleted && activeGoal?.narration && (
        <InlineMarkdown
          className="text-sm text-text-secondary leading-relaxed"
          value={activeGoal.narration}
        />
      )}

      <SandboxTerminal lines={lines} prompt={prompt} disabled={!ready || running} onSubmit={submit} />

      <ExerciseControls
        hints={activeGoal?.hints}
        hintIndex={hintIndex}
        showHint={showHint}
        solved={allCompleted}
        onToggleHint={handleToggleHint}
        onReset={handleReset}
      />

      {allCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm leading-relaxed bg-accent-green/5 border border-accent-green/20">
          <CheckCircle size={18} className="text-accent-green shrink-0" />
          <InlineMarkdown
            className="text-text-secondary"
            value={step.completionMessage ?? 'Exercise complete.'}
          />
        </div>
      )}
    </div>
  )
}
