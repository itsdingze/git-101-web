import { z } from 'zod'
import type {
  BlockExerciseStep,
  ConflictExerciseStep,
  Lesson,
  QuizStep,
  SandboxExerciseStep,
  ScenarioKey,
  VisualizationType,
} from '@/types'
import type { GitCommandName } from '@/lib/git-sim/commands/git/registry'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'

const text = z.string().min(1)
const texts = z.array(text)
const reasons = z.record(z.string(), text)

const goalCheck = z.custom<GoalCheck>(
  (value) => typeof value === 'object' && value !== null && typeof (value as { kind?: unknown }).kind === 'string',
  'needs a check with a kind',
)

const seed = z.custom<SandboxSeed>(
  (value) => typeof value === 'object' && value !== null && typeof (value as { dir?: unknown }).dir === 'string',
  'needs a seed with a dir',
)

export const frontmatterSchema = z.strictObject({
  id: z.number().int().min(0),
  title: text,
  description: text,
  unlocks: z.array(z.custom<GitCommandName>((value) => typeof value === 'string')),
}) satisfies z.ZodType<Omit<Lesson, 'steps'>>

export const visualizationSchema = z.enum([
  'three-place-model',
  'git-graph',
  'conflict-markers',
  'diff-walkthrough',
  'reset-walkthrough',
  'restore-walkthrough',
]) satisfies z.ZodType<VisualizationType>

export const scenarioSchema = z.enum(['branching', 'merging']) satisfies z.ZodType<ScenarioKey>

export const exerciseSchemas = {
  quiz: z.strictObject({
    type: z.literal('quiz'),
    id: text,
    question: text,
    options: z.array(z.strictObject({ text, whyWrong: text.optional() })).min(2),
    correctIndex: z.number().int().min(0),
    explanation: text,
  }) satisfies z.ZodType<QuizStep>,

  'block-exercise': z.strictObject({
    type: z.literal('block-exercise'),
    id: text,
    prompt: text,
    availableBlocks: texts,
    correctAnswer: texts,
    acceptableAnswers: z.array(texts).optional(),
    decoyReasons: reasons.optional(),
    missingReasons: reasons.optional(),
    hints: texts.optional(),
  }) satisfies z.ZodType<BlockExerciseStep>,

  'conflict-exercise': z.strictObject({
    type: z.literal('conflict-exercise'),
    id: text,
    prompt: text,
    fileName: text,
    oursLabel: text,
    theirsLabel: text,
    oursContent: z.string(),
    theirsContent: z.string(),
    surroundingBefore: z.string().optional(),
    surroundingAfter: z.string().optional(),
    acceptableResolutions: z.array(z.string()),
    hints: texts.optional(),
  }) satisfies z.ZodType<ConflictExerciseStep>,

  'sandbox-exercise': z.strictObject({
    type: z.literal('sandbox-exercise'),
    id: text,
    title: text,
    brief: text,
    mode: z.enum(['goal', 'guided']),
    seed,
    goals: z
      .array(z.strictObject({ id: text, label: text, narration: text.optional(), hints: texts.optional(), check: goalCheck }))
      .min(1),
    detours: z.array(z.strictObject({ id: text, check: goalCheck, message: text })).optional(),
    completionMessage: text.optional(),
  }) satisfies z.ZodType<SandboxExerciseStep>,
}

export type ExerciseType = keyof typeof exerciseSchemas

export function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
}
