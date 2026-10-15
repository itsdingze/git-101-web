import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { latchGoals } from '@/lib/git-sim/goals/goalProgress'
import type { SandboxExerciseStep } from '@/types'
import { lessons } from '@/data/lessons'
import { replaySandbox } from './replaySandbox'
import { SOLUTIONS } from './solutions'

const sandboxSteps = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is SandboxExerciseStep => step.type === 'sandbox-exercise')
    .map((step) => ({ lessonId: lesson.id, step })),
)

describe('every sandbox exercise', () => {
  it.each(sandboxSteps)('keeps the terminal lesson files available in lesson $lessonId', async ({ step }) => {
    const sandbox = await createSandbox(step.seed)

    expect(await sandbox.run('cat ~/documents/letter.txt')).toMatchObject({
      outputs: [{ stream: 'stdout', text: 'Dear Sam,' }],
    })
    expect(await sandbox.run('cat ~/projects/recipes/soup.txt')).toMatchObject({
      outputs: [{ stream: 'stdout', text: 'Tomato soup' }],
    })
  })

  it('adds the app inside projects while keeping the terminal lesson files', async () => {
    const step = sandboxSteps.find(({ step }) => step.id === 'start-the-project')?.step
    if (!step) throw new Error('Missing start-the-project exercise')
    const sandbox = await createSandbox(step.seed)

    expect(await sandbox.run('cat ~/documents/letter.txt')).toMatchObject({
      outputs: [{ stream: 'stdout', text: 'Dear Sam,' }],
    })
    expect(await sandbox.run('cat ~/projects/recipes/soup.txt')).toMatchObject({
      outputs: [{ stream: 'stdout', text: 'Tomato soup' }],
    })
    await sandbox.run('cd projects/todo-app')
    expect(await sandbox.prompt()).toEqual({ directory: '~/projects/todo-app', branch: null })
    expect(await sandbox.run('ls')).toMatchObject({
      outputs: [{ stream: 'stdout', text: 'app.py  debug.log  tasks.txt' }],
    })
  })

  it('covers every lesson that teaches a runnable command', () => {
    expect([...new Set(sandboxSteps.map(({ lessonId }) => lessonId))]).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  it.each(sandboxSteps)('seeds cleanly for lesson $lessonId', async ({ step }) => {
    const sandbox = await createSandbox(step.seed)
    const snapshot = await sandbox.snapshot()

    const createsTheRepo = step.goals.some((goal) => goal.check.kind === 'repo-initialized')
    const startsAsClone = step.seed.remote !== undefined && step.seed.remote.cloned !== false
    const plainFolder = !startsAsClone && !(step.seed.setup ?? []).some((seedStep) => 'run' in seedStep)
    expect(snapshot.isRepo).toBe(!createsTheRepo && !plainFolder)

    const checks = step.goals.map((goal) => goal.check)
    const nothingDone = checks.map(() => false)
    expect(latchGoals(step.mode, checks, nothingDone, snapshot)).toEqual(nothingDone)
  })

  it.each(sandboxSteps)('is solvable for lesson $lessonId', async ({ step }) => {
    const solution = SOLUTIONS[step.id]
    expect(solution, `no solution recorded for ${step.id}`).toBeDefined()

    const result = await replaySandbox(step.id, solution ?? [])

    expect(result.failures).toEqual([])
    expect(step.goals.filter((_, index) => !result.completed[index]).map((goal) => goal.id)).toEqual([])
    expect(result.detour).toBeNull()
  })

  it.each(sandboxSteps.slice(0, 1))('reports a locked command typed during a replay of lesson $lessonId', async ({ step }) => {
    const result = await replaySandbox(step.id, ['git push'])

    expect(result.failures).toEqual([expect.stringContaining('git push is taught in')])
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
