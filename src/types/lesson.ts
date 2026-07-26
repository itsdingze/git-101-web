import type { ScenarioKey } from './graph'

export type TextBlock = {
  type: 'text'
  value: string
}

export type CodeBlock = {
  type: 'code'
  language: string
  value: string
}

export type ContentBlock = TextBlock | CodeBlock

export type VisualizationType =
  | 'three-place-model'
  | 'git-graph'
  | 'conflict-markers'
  | 'diff-walkthrough'
  | 'reset-walkthrough'
  | 'restore-walkthrough'

export type ReadingStep = {
  type: 'reading'
  id: string
  title?: string
  content: ContentBlock[]
  visualization?: VisualizationType
  visualizationVariant?: ScenarioKey
}

export type QuizStep = {
  type: 'quiz'
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type TerminalExerciseStep = {
  type: 'terminal-exercise'
  id: string
  prompt: string
  expectedCommand: string
  acceptableVariants?: readonly string[]
  successOutput: string
  hints?: readonly string[]
}

export type BlockExerciseStep = {
  type: 'block-exercise'
  id: string
  prompt: string
  availableBlocks: readonly string[]
  correctAnswer: readonly string[]
  /** Equally valid answers buildable from `availableBlocks`, e.g. `git checkout -b` for `git switch -c`. */
  acceptableAnswers?: readonly (readonly string[])[]
  hints?: readonly string[]
}

export type ConflictExerciseStep = {
  type: 'conflict-exercise'
  id: string
  prompt: string
  fileName: string
  oursLabel: string
  theirsLabel: string
  oursContent: string
  theirsContent: string
  surroundingBefore?: string
  surroundingAfter?: string
  acceptableResolutions: string[]
  hints?: readonly string[]
}

export type WorkflowSubStep = {
  narration: string
  expectedCommand: string
  acceptableVariants?: readonly string[]
  acceptPrefix?: string
  successOutput: string
  hints?: readonly string[]
}

export type WorkflowExerciseStep = {
  type: 'workflow-exercise'
  id: string
  title: string
  scenario: string
  steps: WorkflowSubStep[]
  completionMessage?: string
}

export type Step = ReadingStep | QuizStep | TerminalExerciseStep | BlockExerciseStep | ConflictExerciseStep | WorkflowExerciseStep

export type Lesson = {
  id: number
  title: string
  description: string
  steps: readonly Step[]
}
