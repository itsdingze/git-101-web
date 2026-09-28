import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from './goalFixtures'
import type { GoalCheck } from './goalChecks'
import { latchGoals } from './goalProgress'

const onFeature: GoalCheck = { kind: 'on-branch', name: 'feature' }
const featureExists: GoalCheck = { kind: 'branch-exists', name: 'feature' }
const onMain: GoalCheck = { kind: 'on-branch', name: 'main' }

describe('latchGoals', () => {
  it('keeps a goal once met, even after it stops being true', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git switch -c feature')
    const first = latchGoals('goal', [onFeature, onMain], [false, false], await sandbox.snapshot())

    await sandbox.run('git switch main')
    expect(latchGoals('goal', [onFeature, onMain], first, await sandbox.snapshot())).toEqual([true, true])
  })

  it('only advances guided goals in order', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git branch feature')

    expect(latchGoals('guided', [onFeature, featureExists], [false, false], await sandbox.snapshot())).toEqual([
      false,
      false,
    ])
    expect(latchGoals('goal', [onFeature, featureExists], [false, false], await sandbox.snapshot())).toEqual([
      false,
      true,
    ])
  })
})
