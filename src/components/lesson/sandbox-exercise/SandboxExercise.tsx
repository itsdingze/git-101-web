import { useState } from 'react'
import type { SandboxExerciseStep } from '@/types'
import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'
import { ExerciseControls } from '@/components/lesson/components/ExerciseControls'
import { HintButton } from '@/components/lesson/components/HintButton'
import { useContinueGate } from './hooks/useContinueGate'
import { useSandboxExercise } from './hooks/useSandboxExercise'
import { useExerciseSeed } from './hooks/useExerciseSeed'
import { useIdentityCapture } from './hooks/useIdentityCapture'
import { useStepCompletion } from './hooks/useStepCompletion'
import { useGoalHints } from './hooks/useGoalHints'
import { SandboxTerminal } from './components/SandboxTerminal'
import { ConflictEditorPanel } from './components/ConflictEditorPanel'
import { messages } from '@/messages/en'

interface SandboxExerciseProps {
  step: SandboxExerciseStep
  lessonId: number
}

export function SandboxExercise({ step, lessonId }: SandboxExerciseProps) {
  const seed = useExerciseSeed(step.seed)
  const { terminal, files, snapshot, allCompleted, activeGoalIndex, say, reset } = useSandboxExercise(step, seed, lessonId)
  const activeGoal = step.goals[activeGoalIndex]
  const isCompleted = useStepCompletion(lessonId, step.id, allCompleted)
  const { showNextHint, forgetHints } = useGoalHints(activeGoal, say)
  const [attempt, setAttempt] = useState(0)
  const [terminalFocusRequest, setTerminalFocusRequest] = useState(0)

  useIdentityCapture(seed, snapshot)
  useContinueGate(allCompleted || isCompleted)

  function handleReset() {
    forgetHints()
    setAttempt((count) => count + 1)
    reset()
  }

  return (
    <div className="space-y-6">
      <InlineMarkdown as="h2" className="text-xl font-semibold text-text-primary tracking-tight" value={step.title} />

      <InlineMarkdown className="text-sm text-text-secondary leading-relaxed" value={step.brief} />

      {isCompleted && !allCompleted && (
        <p className="text-sm text-text-muted">{messages.sandbox.alreadyCompleted}</p>
      )}

      <ConflictEditorPanel
        key={attempt}
        files={files}
        projectDir={step.seed.dir}
        onSaved={() => setTerminalFocusRequest((count) => count + 1)}
      />

      <SandboxTerminal session={terminal} focusRequest={terminalFocusRequest} />

      <ExerciseControls solved={allCompleted} onReset={handleReset}>
        {activeGoal?.hints && <HintButton onHint={showNextHint} />}
      </ExerciseControls>
    </div>
  )
}
