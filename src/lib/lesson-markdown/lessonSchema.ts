import { z } from 'zod'
import type {
  BlockExerciseStep,
  Lesson,
  QuizStep,
  SandboxExerciseStep,
  Visualization,
  VisualizationType,
} from '@/types'
import type { LockableCommand } from '@/lib/git-sim/input/commandLocks'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import { playGitGraph } from './playGitGraph'
import { isRecord } from './isRecord'

const text = z.string().min(1)
const texts = z.array(text)
const reasons = z.record(z.string(), text)

const goalCheck = z.custom<GoalCheck>(
  (value) => isRecord(value) && typeof value.kind === 'string',
  'needs a check with a kind',
)

const seedTarget = z.enum(['local', 'remote']).optional()

const seedSteps = z.array(
  z.union([
    z.strictObject({ run: text, at: seedTarget, allowFailure: z.boolean().optional() }),
    z.strictObject({ write: z.record(z.string(), z.string()), at: seedTarget }),
    z.strictObject({ remove: texts, at: seedTarget }),
  ]),
)

const seed = z.strictObject({
  dir: z.string(),
  start: z.string().optional(),
  identity: z.strictObject({ name: z.string(), email: z.string() }).optional(),
  remote: z
    .strictObject({
      name: text,
      url: text,
      cloned: z.boolean().optional(),
      setup: seedSteps.optional(),
      ahead: seedSteps.optional(),
    })
    .optional(),
  github: z.strictObject({ signedIn: z.boolean().optional(), teammateApproves: z.boolean().optional() }).optional(),
  setup: seedSteps.optional(),
}) satisfies z.ZodType<SandboxSeed>

export const frontmatterSchema = z.strictObject({
  id: z.number().int().min(0),
  title: text,
  description: text,
  unlocks: z.array(z.custom<LockableCommand>((value) => typeof value === 'string')),
}) satisfies z.ZodType<Omit<Lesson, 'steps'>>

export const visualizationSchemas = {
  'three-place-model': z
    .strictObject({
      kind: z.literal('three-place-model'),
      files: texts.min(1),
      ignored: texts,
      stageFirst: text,
      commitMessage: text,
    })
    .refine((data) => data.files.includes(data.stageFirst), { path: ['stageFirst'], error: 'must be one of the files' }),

  'git-graph': z
    .strictObject({ kind: z.literal('git-graph'), setup: texts, commands: texts })
    .transform(({ kind, ...script }) => ({ kind, ...playGitGraph(script) })),
} satisfies { [Kind in VisualizationType]: z.ZodType<Extract<Visualization, { kind: Kind }>> }

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
    detours: z
      .array(z.strictObject({ id: text, untilGoal: text.optional(), check: goalCheck, message: text }))
      .optional(),
    completionMessage: text.optional(),
  }) satisfies z.ZodType<SandboxExerciseStep>,
}

export type ExerciseType = keyof typeof exerciseSchemas

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw new Error(describeIssues(result.error))
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
}
