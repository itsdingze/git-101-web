import type { GitScenario } from './graph'
import type { PromptInfo, SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'
import type { LockableCommand } from '@/lib/git-sim/input/commandLocks'

type TextBlock = {
  type: 'text'
  value: string
}

export type CodeBlock = {
  type: 'code'
  language: string
  value: string
}

export type DiffLineChange = 'unchanged' | 'added' | 'removed'

export type DiffLine = {
  change: DiffLineChange
  text: string
}

export type DiffBlock = {
  type: 'diff'
  path: string
  fileName: string
  folder: string
  lines: readonly DiffLine[]
}

export type TerminalTranscriptLine =
  | { kind: 'command'; prompt: PromptInfo; text: string; note: string }
  | { kind: 'output'; text: string; note: string }
  | { kind: 'note'; text: string }

export type TerminalBlock = {
  type: 'terminal'
  lines: readonly TerminalTranscriptLine[]
}

type FileEntryBase = {
  name: string
  hidden: boolean
}

type FolderEntry = FileEntryBase & {
  kind: 'folder'
  entries: readonly FileEntry[]
}

export type FileEntry = (FileEntryBase & { kind: 'file' }) | FolderEntry

export type FileEntryKind = FileEntry['kind']

export type FilesBlock = {
  type: 'files'
  path: string
  home: readonly FileEntry[]
}

type ListBlock = {
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
  label: string
  tabs: readonly {
    label: string
    content: readonly Exclude<ContentBlock, TabsBlock>[]
  }[]
}

export type ContentBlock =
  | TextBlock
  | CodeBlock
  | DiffBlock
  | TerminalBlock
  | FilesBlock
  | ListBlock
  | CalloutBlock
  | TabsBlock

export type ThreePlaceModelData = {
  files: readonly string[]
  ignored: readonly string[]
  stageFirst: string
  commitMessage: string
}

export type Visualization =
  | ({ kind: 'three-place-model' } & ThreePlaceModelData)
  | ({ kind: 'git-graph' } & GitScenario)

export type VisualizationType = Visualization['kind']

export type ReadingStep = {
  type: 'reading'
  id: string
  title?: string
  content: ContentBlock[]
  visualization?: Visualization
}

type QuizOption = {
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
  acceptableAnswers?: readonly (readonly string[])[]
  decoyReasons?: Readonly<Record<string, string | undefined>>
  missingReasons?: Readonly<Record<string, string | undefined>>
  hints?: readonly string[]
}

export type SandboxGoal = {
  id: string
  label: string
  narration?: string
  hints?: readonly string[]
  check: GoalCheck
}

export type SandboxDetour = {
  id: string
  untilGoal?: string
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

export type Step = ReadingStep | QuizStep | BlockExerciseStep | SandboxExerciseStep

export type Lesson = {
  id: number
  title: string
  description: string
  unlocks: readonly LockableCommand[]
  steps: readonly Step[]
}
