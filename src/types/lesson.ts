import type { ScenarioKey } from './graph'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'
import type { GitCommandName } from '@/lib/git-sim/commands/git/registry'

export type TextBlock = {
  type: 'text'
  value: string
}

export type CodeBlock = {
  type: 'code'
  language: string
  value: string
}

export type ListBlock = {
  type: 'list'
  ordered?: boolean
  items: readonly string[]
}

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger'

export type CalloutBlock = {
  type: 'callout'
  variant: CalloutVariant
  title?: string
  value: string
}

export type TabsBlock = {
  type: 'tabs'
  group: string
  tabs: readonly {
    label: string
    content: readonly (TextBlock | CodeBlock | ListBlock | CalloutBlock)[]
  }[]
}

export type ContentBlock = TextBlock | CodeBlock | ListBlock | CalloutBlock | TabsBlock

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

export type QuizOption = {
  text: string
  whyWrong?: string
}

export type QuizStep = {
  type: 'quiz'
  id: string
  question: string
  options: readonly QuizOption[]
  correctIndex: number
  explanation: string
}

export type BlockExerciseStep = {
  type: 'block-exercise'
  id: string
  prompt: string
  availableBlocks: readonly string[]
  correctAnswer: readonly string[]
  /** Equally valid answers buildable from `availableBlocks`, e.g. `git checkout -b` for `git switch -c`. */
  acceptableAnswers?: readonly (readonly string[])[]
  decoyReasons?: Readonly<Record<string, string | undefined>>
  missingReasons?: Readonly<Record<string, string | undefined>>
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

export type SandboxGoal = {
  id: string
  label: string
  /** Shown one at a time in `guided` mode, ignored in `goal` mode. */
  narration?: string
  hints?: readonly string[]
  check: GoalCheck
}

export type SandboxDetour = {
  id: string
  check: GoalCheck
  message: string
}

export type SandboxExerciseStep = {
  type: 'sandbox-exercise'
  id: string
  title: string
  brief: string
  mode: 'goal' | 'guided'
  seed: SandboxSeed
  goals: readonly SandboxGoal[]
  detours?: readonly SandboxDetour[]
  completionMessage?: string
}

export type Step = ReadingStep | QuizStep | BlockExerciseStep | ConflictExerciseStep | SandboxExerciseStep

export type Lesson = {
  id: number
  title: string
  description: string
  unlocks: readonly GitCommandName[]
  steps: readonly Step[]
}
