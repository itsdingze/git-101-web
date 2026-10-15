import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { activeDetour } from '@/lib/git-sim/goals/detours'
import { completedGoalIds, latchGoals } from '@/lib/git-sim/goals/goalProgress'
import type { SandboxExerciseStep } from '@/types'
import { lessons } from '@/data/lessons'
import { commandLocksFor } from '@/data/lessons/commandLocks'
import type { EditorSave, SolutionStep } from './solutions'

type ReplayResult = {
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

export async function saveInEditor(sandbox: Sandbox, save: EditorSave): Promise<void> {
  for (const [path, contents] of Object.entries(save.write)) await sandbox.writeFile(path, contents)
}

async function runLine(sandbox: Sandbox, line: string): Promise<string[]> {
  const result = await sandbox.run(line)
  return result.outputs
    .filter((output) => output.stream === 'stderr' && /^(fatal|error):| is taught in /m.test(output.text))
    .map((output) => `${line}: ${output.text}`)
}

export async function replaySandbox(
  stepId: string,
  lines: readonly SolutionStep[],
  seedOverride?: Partial<SandboxSeed>,
): Promise<ReplayResult> {
  const { lessonId, step } = findSandboxStep(stepId)
  const sandbox = await createSandbox({ ...step.seed, ...seedOverride }, commandLocksFor(lessonId), 'navigation-only')
  const checks = step.goals.map((goal) => goal.check)
  let completed = checks.map(() => false)
  const failures: string[] = []

  for (const line of lines) {
    if (typeof line === 'string') failures.push(...(await runLine(sandbox, line)))
    else await saveInEditor(sandbox, line)
    completed = latchGoals(step.mode, checks, completed, await sandbox.snapshot())
  }

  const snapshot = await sandbox.snapshot()

  return {
    completed,
    detour: activeDetour(step.detours, snapshot, completedGoalIds(step.goals, completed))?.id ?? null,
    failures,
  }
}
