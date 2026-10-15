import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { SandboxExerciseStep } from '@/types'
import { activeGoalIndex, advanceCoachState, startingCoachState } from './goalTracker'

const COMMITTED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const STEP: SandboxExerciseStep = {
  type: 'sandbox-exercise',
  id: 'branching',
  title: 'Branch',
  brief: 'Make a branch and switch to it.',
  mode: 'goal',
  seed: COMMITTED_SEED,
  goals: [
    { id: 'make', label: 'Make a branch', check: { kind: 'branch-exists', name: 'feature' } },
    { id: 'switch', label: 'Switch to it', check: { kind: 'on-branch', name: 'feature' } },
  ],
  detours: [{ id: 'stray', check: { kind: 'branch-exists', name: 'feature' }, message: 'Now switch to it.' }],
}

describe('advanceCoachState', () => {
  it('keeps a goal once met, even after it stops being true', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git switch -c feature')
    const met = advanceCoachState(STEP, startingCoachState(STEP), await sandbox.snapshot())

    await sandbox.run('git switch main')
    const later = advanceCoachState(STEP, met, await sandbox.snapshot())

    expect(later.completed).toEqual([true, true])
  })

  it('raises a detour while goals remain', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git branch feature')

    const state = advanceCoachState(STEP, startingCoachState(STEP), await sandbox.snapshot())

    expect(state.completed).toEqual([true, false])
    expect(state.detour?.id).toBe('stray')
  })

  it('drops the detour once every goal is done', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git branch feature')
    const strayed = advanceCoachState(STEP, startingCoachState(STEP), await sandbox.snapshot())

    await sandbox.run('git switch feature')
    const done = advanceCoachState(STEP, strayed, await sandbox.snapshot())

    expect(done.completed).toEqual([true, true])
    expect(done.detour).toBeNull()
  })
})

describe('activeGoalIndex', () => {
  it('points at the first goal not yet met', () => {
    expect(activeGoalIndex([true, false, false])).toBe(1)
  })

  it('stays on the last goal once every goal is met', () => {
    expect(activeGoalIndex([true, true, true])).toBe(2)
  })
})
