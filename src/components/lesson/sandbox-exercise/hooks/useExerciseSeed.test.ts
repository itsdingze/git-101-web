// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { SandboxSeed } from '@/lib/git-sim/createSandbox'
import { useProgressStore } from '@/stores/progressStore'
import { useExerciseSeed } from './useExerciseSeed'

const SEED: SandboxSeed = { dir: 'cookbook' }
const ADA = { name: 'Ada Lovelace', email: 'ada@example.com' }

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ identity: null })
})

afterEach(cleanup)

describe('useExerciseSeed', () => {
  it('starts the sandbox with the identity the learner saved earlier', () => {
    useProgressStore.setState({ identity: ADA })

    const { result } = renderHook(() => useExerciseSeed(SEED))

    expect(result.current.identity).toEqual(ADA)
  })

  it('keeps the same seed across renders, so the sandbox is not rebuilt', () => {
    useProgressStore.setState({ identity: ADA })
    const { result, rerender } = renderHook(() => useExerciseSeed(SEED))
    const first = result.current

    act(() => {
      useProgressStore.setState({ identity: { ...ADA } })
    })
    rerender()

    expect(result.current).toBe(first)
  })

  it('picks up an identity the learner saves while the exercise is open', () => {
    const { result } = renderHook(() => useExerciseSeed(SEED))
    expect(result.current.identity).toBeUndefined()

    act(() => useProgressStore.getState().setIdentity(ADA))

    expect(result.current.identity).toEqual(ADA)
  })
})
