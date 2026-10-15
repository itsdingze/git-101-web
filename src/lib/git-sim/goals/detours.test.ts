import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { activeDetour } from './detours'

describe('activeDetour', () => {
  const detours = [
    { id: 'no-branch', check: { kind: 'branch-exists', name: 'nope' }, message: 'never' },
    { id: 'on-main', check: { kind: 'on-branch', name: 'main' }, message: 'You are on main.' },
    { id: 'also-main', check: { kind: 'on-branch', name: 'main' }, message: 'second match' },
  ] as const

  it('returns the first detour whose check matches', async () => {
    const snapshot = await (await createSandbox(COMMITTED_SEED)).snapshot()
    expect(activeDetour(detours, snapshot)?.id).toBe('on-main')
  })

  it('returns null when nothing matches or there are no detours', async () => {
    const snapshot = await (await createSandbox(COMMITTED_SEED)).snapshot()
    expect(activeDetour([detours[0]], snapshot)).toBeNull()
    expect(activeDetour(undefined, snapshot)).toBeNull()
  })

  it('skips a detour once the goal it waits on is met', async () => {
    const snapshot = await (await createSandbox(COMMITTED_SEED)).snapshot()
    const gated = [
      { id: 'early', untilGoal: 'looked', check: { kind: 'on-branch', name: 'main' }, message: 'Look first.' },
    ] as const
    expect(activeDetour(gated, snapshot, new Set())?.id).toBe('early')
    expect(activeDetour(gated, snapshot, new Set(['looked']))).toBeNull()
  })
})
