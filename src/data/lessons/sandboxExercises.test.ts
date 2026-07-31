import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals'
import type { SandboxExerciseStep } from '@/types'
import lessons from './index'

const SOLUTIONS: Record<string, readonly string[]> = {
  'first-commit-loop': ['git status', 'git add .', 'git status', 'git commit -m "Initial commit"', 'git log --oneline'],
  'branch-isolation-walkthrough': [
    'git switch -c add-navbar',
    'git add .',
    'git commit -m "Add navbar"',
    'git switch main',
    'ls',
    'git switch add-navbar',
    'ls',
  ],
  'merge-loop-practice': [
    'git switch main',
    'git merge add-navbar',
    'git log --oneline --graph',
    'git branch -d add-navbar',
  ],
  'feature-branch-workflow-practice': [
    'git switch main',
    'git pull origin main',
    'git switch -c feature/add-auth',
    'git add .',
    'git commit -m "feat: add login page"',
    'git push -u origin feature/add-auth',
  ],
}

const sandboxSteps = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is SandboxExerciseStep => step.type === 'sandbox-exercise')
    .map((step) => ({ lessonId: lesson.id, step })),
)

describe('every sandbox exercise', () => {
  it('covers all four converted lessons', () => {
    expect(sandboxSteps.map(({ lessonId }) => lessonId)).toEqual([3, 6, 7, 11])
  })

  it.each(sandboxSteps)('seeds cleanly for lesson $lessonId', async ({ step }) => {
    const sandbox = await createSandbox(step.seed)
    const snapshot = await sandbox.snapshot()

    expect(snapshot.isRepo).toBe(true)
    expect(step.goals.some((goal) => evaluateGoal(goal.check, snapshot))).toBe(false)
  })

  it.each(sandboxSteps)('is solvable for lesson $lessonId', async ({ step }) => {
    const solution = SOLUTIONS[step.id]
    expect(solution, `no solution recorded for ${step.id}`).toBeDefined()

    const sandbox = await createSandbox(step.seed)
    const latched = step.goals.map(() => false)

    for (const line of solution ?? []) {
      const result = await sandbox.run(line)
      const failure = result.outputs.find((output) => output.stream === 'stderr')
      expect(failure?.text, `"${line}" failed in ${step.id}`).toBeUndefined()

      const snapshot = await sandbox.snapshot()
      step.goals.forEach((goal, index) => {
        latched[index] = latched[index] || evaluateGoal(goal.check, snapshot)
      })
    }

    const unmet = step.goals.filter((_, index) => !latched[index]).map((goal) => goal.id)
    expect(unmet).toEqual([])
  })

  it.each(sandboxSteps)('has hints and a unique id per goal for lesson $lessonId', ({ step }) => {
    const ids = step.goals.map((goal) => goal.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(step.goals.every((goal) => (goal.hints?.length ?? 0) > 0)).toBe(true)
    if (step.mode === 'guided') {
      expect(step.goals.every((goal) => goal.narration !== undefined)).toBe(true)
    }
  })
})
