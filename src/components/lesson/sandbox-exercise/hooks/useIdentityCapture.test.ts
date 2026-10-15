// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import { useProgressStore } from '@/stores/progressStore'
import { useIdentityCapture } from './useIdentityCapture'

const CAPTURING_SEED: SandboxSeed = { dir: 'cookbook', identity: { name: '', email: '' } }

async function snapshotAfter(seed: SandboxSeed, ...lines: string[]): Promise<RepoSnapshot> {
  const sandbox = await createSandbox(seed)
  for (const line of lines) await sandbox.run(line)
  return sandbox.snapshot()
}

function savedIdentity(): unknown {
  const saved = localStorage.getItem('git-101-progress')
  return saved ? (JSON.parse(saved) as { state: { identity: unknown } }).state.identity : undefined
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ identity: null })
})

afterEach(cleanup)

describe('useIdentityCapture', () => {
  it('saves the name and email the learner sets, so it survives a reload', async () => {
    const snapshot = await snapshotAfter(
      CAPTURING_SEED,
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email ada@example.com',
    )

    renderHook(() => useIdentityCapture(CAPTURING_SEED, snapshot))

    const identity = { name: 'Ada Lovelace', email: 'ada@example.com' }
    expect(useProgressStore.getState().identity).toEqual(identity)
    expect(savedIdentity()).toEqual(identity)
  })

  it('saves the newer identity when the learner changes it', async () => {
    const first = await snapshotAfter(
      CAPTURING_SEED,
      'git config --global user.name "Ada"',
      'git config --global user.email ada@example.com',
    )
    const changed = await snapshotAfter(
      CAPTURING_SEED,
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email ada@example.com',
    )

    const { rerender } = renderHook(({ snapshot }) => useIdentityCapture(CAPTURING_SEED, snapshot), {
      initialProps: { snapshot: first },
    })
    rerender({ snapshot: changed })

    expect(savedIdentity()).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' })
  })

  it('waits while the name is still the placeholder from the instructions', async () => {
    const snapshot = await snapshotAfter(
      CAPTURING_SEED,
      'git config --global user.name "Your Name"',
      'git config --global user.email ada@example.com',
    )

    renderHook(() => useIdentityCapture(CAPTURING_SEED, snapshot))

    expect(useProgressStore.getState().identity).toBeNull()
  })

  it('ignores an exercise that sets its own identity', async () => {
    const seed: SandboxSeed = { dir: 'cookbook', identity: { name: 'Sam', email: 'sam@example.com' } }
    const snapshot = await snapshotAfter(seed)

    renderHook(() => useIdentityCapture(seed, snapshot))

    expect(useProgressStore.getState().identity).toBeNull()
  })

  it('does nothing before the sandbox has a snapshot', () => {
    renderHook(() => useIdentityCapture(CAPTURING_SEED, null))

    expect(useProgressStore.getState().identity).toBeNull()
  })
})
