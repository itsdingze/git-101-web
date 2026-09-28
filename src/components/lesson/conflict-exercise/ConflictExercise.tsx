import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ConflictExerciseStep } from '@/types'
import ExerciseControls from '@/components/lesson/ExerciseControls'
import InlineMarkdown from '@/components/ui/InlineMarkdown'
import ConflictFileEditor from './components/ConflictFileEditor'
import ResolutionFeedback from './components/ResolutionFeedback'
import ResolvedFile from './components/ResolvedFile'
import useConflictResolution from './hooks/useConflictResolution'

interface ConflictExerciseProps {
  step: ConflictExerciseStep
  lessonId: number
}

export default function ConflictExercise({ step, lessonId }: ConflictExerciseProps) {
  const prefersReduced = useReducedMotion()
  const feedbackId = useId()
  const { buffer, solved, failure, shake, hintIndex, showHint, edit, toggleHint, reset } =
    useConflictResolution(step, lessonId)

  return (
    <div className="space-y-6">
      <InlineMarkdown
        as="h2"
        className="text-base font-semibold text-text-primary leading-snug"
        value={step.prompt}
      />

      {solved ? (
        <ResolvedFile fileName={step.fileName} content={buffer} />
      ) : (
        <motion.div
          animate={shake && !prefersReduced ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <ConflictFileEditor
            fileName={step.fileName}
            value={buffer}
            invalid={failure !== null}
            describedById={feedbackId}
            onChange={edit}
          />
        </motion.div>
      )}

      <ResolutionFeedback id={feedbackId} status={solved ? 'solved' : failure} />

      <ExerciseControls
        hints={step.hints}
        hintIndex={hintIndex}
        showHint={showHint}
        solved={solved}
        onToggleHint={toggleHint}
        onReset={reset}
      />
    </div>
  )
}
