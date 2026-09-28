import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { activeDetour } from '@/lib/git-sim/goals/detours'
import { latchGoals } from '@/lib/git-sim/goals/goalProgress'
import type { SandboxExerciseStep } from '@/types'
import lessons from '@/data/lessons'
import { commandLocksFor } from '@/data/lessons/commandLocks'

export type ReplayResult = {
  completed: boolean[]
  detour: string | null
  failures: string[]
}

function findSandboxStep(stepId: string): { lessonId: number; step: SandboxExerciseStep } {
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type === 'sandbox-exercise' && step.id === stepId) return { lessonId: lesson.id, step }
    }
  }
  throw new Error(`no sandbox step with id ${stepId}`)
}

export async function replaySandbox(
  stepId: string,
  lines: readonly string[],
  seedOverride?: Partial<SandboxSeed>,
): Promise<ReplayResult> {
  const { lessonId, step } = findSandboxStep(stepId)
  const sandbox = await createSandbox({ ...step.seed, ...seedOverride }, commandLocksFor(lessonId))
  const checks = step.goals.map((goal) => goal.check)
  let completed = checks.map(() => false)
  const failures: string[] = []

  for (const line of lines) {
    const result = await sandbox.run(line)
    for (const output of result.outputs) {
      if (output.stream === 'stderr' && /^(fatal|error):|is taught in Lesson/m.test(output.text)) {
        failures.push(`${line}: ${output.text}`)
      }
    }
    completed = latchGoals(step.mode, checks, completed, await sandbox.snapshot())
  }

  const snapshot = await sandbox.snapshot()

  return {
    completed,
    detour: activeDetour(step.detours, snapshot)?.id ?? null,
    failures,
  }
}
