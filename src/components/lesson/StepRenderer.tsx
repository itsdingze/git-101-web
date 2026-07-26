import type { Step } from '@/types'
import ReadingStep from './reading/ReadingStep'
import BlockExercise from './block-exercise/BlockExercise'
import TerminalExercise from './terminal-exercise/TerminalExercise'
import QuizStep from './quiz/QuizStep'
import ConflictExercise from './conflict-exercise/ConflictExercise'
import WorkflowExercise from './workflow-exercise/WorkflowExercise'

interface StepRendererProps {
  step: Step
  lessonId: number
}

export default function StepRenderer({ step, lessonId }: StepRendererProps) {
  switch (step.type) {
    case 'reading':
      return <ReadingStep step={step} />
    case 'block-exercise':
      return <BlockExercise step={step} lessonId={lessonId} />
    case 'terminal-exercise':
      return <TerminalExercise step={step} lessonId={lessonId} />
    case 'quiz':
      return <QuizStep step={step} lessonId={lessonId} />
    case 'conflict-exercise':
      return <ConflictExercise step={step} lessonId={lessonId} />
    case 'workflow-exercise':
      return <WorkflowExercise step={step} lessonId={lessonId} />
    default: {
      const _exhaustive: never = step
      return _exhaustive
    }
  }
}
