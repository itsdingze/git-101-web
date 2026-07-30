import { useRef, useEffect, useState, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import type { WorkflowExerciseStep } from '@/types'
import FakeTerminal, { type FakeTerminalHandle } from '@/components/lesson/components/FakeTerminal'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import { useLessonNav } from '@/hooks/useLessonNav'
import useWorkflowExercise from './hooks/useWorkflowExercise'

interface WorkflowExerciseProps {
  step: WorkflowExerciseStep
  lessonId: number
}

export default function WorkflowExercise({ step, lessonId }: WorkflowExerciseProps) {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const { currentSubStep, completedSubSteps, allCompleted, handleSubmit, hintIndex, reset } =
    useWorkflowExercise(step.steps, isCompleted)

  const terminalRef = useRef<FakeTerminalHandle>(null)
  const [hasInput, setHasInput] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const { triggerCheck } = useLessonNav()

  useEffect(() => {
    if (allCompleted && !isCompleted) {
      completeStep(lessonId, step.id)
    }
  }, [allCompleted, isCompleted, completeStep, lessonId, step.id])

  useExerciseNav({
    solved: allCompleted,
    checkFn: () => terminalRef.current?.submit(),
    checkDisabled: !hasInput,
  })

  const handleInputChange = useCallback((hasValue: boolean) => {
    setHasInput(hasValue)
  }, [])

  function handleTerminalSubmit(command: string) {
    const result = handleSubmit(command)
    if (result.correct) {
      setShowHint(false)
    }
    return result
  }

  function handleReset() {
    reset()
    setHasInput(false)
    setShowHint(false)
    setResetKey((k) => k + 1)
  }

  const activeSubStep = step.steps[currentSubStep]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary tracking-tight">{step.title}</h2>

      <InlineMarkdown className="text-sm text-text-secondary leading-relaxed" value={step.scenario} />

      {/* eslint-disable react-x/no-array-index-key -- static lesson data, order never changes */}
      <div className="flex items-center gap-2">
        {step.steps.map((s, i) => (
          <div
            key={`bar-${i}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              completedSubSteps[i]
                ? 'bg-accent-green'
                : i === currentSubStep
                  ? 'bg-text-primary'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {step.steps.map(
        (substep, i) =>
          completedSubSteps[i] && (i !== currentSubStep || allCompleted) && (
            <div key={`done-${i}`} className="flex items-start gap-2 text-sm">
              <CheckCircle size={14} className="text-accent-green shrink-0 mt-0.5" />
              <div>
                <code className="font-mono text-xs text-text-primary">{substep.expectedCommand}</code>
                {substep.successOutput && (
                  <pre className="text-xs text-text-muted mt-1 font-mono">{substep.successOutput}</pre>
                )}
              </div>
            </div>
          )
      )}
      {/* eslint-enable react-x/no-array-index-key */}

      {!allCompleted && activeSubStep && (
        <>
          <InlineMarkdown
            className="text-sm text-text-secondary leading-relaxed"
            value={activeSubStep.narration}
          />

          <FakeTerminal
            key={`${currentSubStep}-${resetKey}`}
            ref={terminalRef}
            onSubmit={handleTerminalSubmit}
            successOutput={activeSubStep.successOutput}
            disabled={false}
            onInputChange={handleInputChange}
            onEnter={triggerCheck}
          />

          <ExerciseControls
            hints={activeSubStep.hints}
            hintIndex={hintIndex}
            showHint={showHint}
            solved={false}
            onToggleHint={() => setShowHint((prev) => !prev)}
            onReset={handleReset}
          />
        </>
      )}

      {allCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm leading-relaxed bg-accent-green/5 border border-accent-green/20">
          <CheckCircle size={18} className="text-accent-green shrink-0" />
          <InlineMarkdown
            className="text-text-secondary"
            value={step.completionMessage ?? 'Workflow complete!'}
          />
        </div>
      )}
    </div>
  )
}
