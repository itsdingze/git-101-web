import { useState, useRef, useCallback } from 'react'
import type { TerminalExerciseStep } from '@/types'
import FakeTerminal, { type FakeTerminalHandle } from '@/components/lesson/components/FakeTerminal'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import useProgressStore from '@/stores/progressStore'
import useExerciseNav from '@/hooks/useExerciseNav'
import { useLessonNav } from '@/hooks/useLessonNav'
import getCommandFeedback from '@/utils/commandDiff'

function normalizeCommand(cmd: string): string {
  return cmd.trim().replace(/\s+/g, ' ').toLowerCase()
}

interface TerminalExerciseProps {
  step: TerminalExerciseStep
  lessonId: number
}

export default function TerminalExercise({ step, lessonId }: TerminalExerciseProps) {
  const completeStep = useProgressStore((s) => s.completeStep)
  const isCompleted = useProgressStore((s) => !!s.completedSteps[`${lessonId}:${step.id}`])

  const [solved, setSolved] = useState(isCompleted)
  const [hasInput, setHasInput] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const terminalRef = useRef<FakeTerminalHandle>(null)
  const { triggerCheck } = useLessonNav()

  const initialHistory = isCompleted
    ? [{ id: -1, command: step.expectedCommand, output: step.successOutput || 'Command executed successfully.', type: 'success' as const }]
    : []

  function handleReset() {
    setSolved(false)
    setHasInput(false)
    setShowHint(false)
    setHintIndex(0)
    setResetKey((k) => k + 1)
  }

  useExerciseNav({ solved, checkFn: () => terminalRef.current?.submit(), checkDisabled: !hasInput })

  const handleInputChange = useCallback((hasValue: boolean) => {
    setHasInput(hasValue)
  }, [])

  function handleSubmit(command: string) {
    const normalized = normalizeCommand(command)
    const expected = normalizeCommand(step.expectedCommand)
    const variants = (step.acceptableVariants || []).map(normalizeCommand)

    if (normalized === expected || variants.includes(normalized)) {
      setSolved(true)
      completeStep(lessonId, step.id)
      return { correct: true }
    }

    const diffFeedback = getCommandFeedback(command, step.expectedCommand, step.acceptableVariants)
    if (diffFeedback) {
      return { correct: false, hint: diffFeedback }
    }

    const hint = step.hints?.[Math.min(hintIndex, step.hints.length - 1)]
    setHintIndex((i) => Math.min(i + 1, (step.hints?.length || 1) - 1))
    return { correct: false, hint: hint || 'Not quite. Try again!' }
  }

  return (
    <div className="space-y-6">
      <InlineMarkdown
        className="text-base font-medium text-text-primary leading-snug"
        value={step.prompt}
      />

      <FakeTerminal
        key={resetKey}
        ref={terminalRef}
        onSubmit={handleSubmit}
        successOutput={step.successOutput}
        disabled={solved}
        initialHistory={resetKey === 0 ? initialHistory : []}
        onInputChange={handleInputChange}
        onEnter={triggerCheck}
      />

      <ExerciseControls
        hints={step.hints}
        hintIndex={hintIndex}
        showHint={showHint}
        solved={solved}
        onToggleHint={() => setShowHint((prev) => !prev)}
        onReset={handleReset}
      />
    </div>
  )
}
