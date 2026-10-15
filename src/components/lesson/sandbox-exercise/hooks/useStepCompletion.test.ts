// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useProgressStore } from '@/stores/progressStore'
import { useStepCompletion } from './useStepCompletion'

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('useStepCompletion', () => {
  it('reports a step the learner finished on an earlier visit', () => {
    useProgressStore.setState({ completedSteps: { '3:practice': true } })

    const { result } = renderHook(() => useStepCompletion(3, 'practice', false))

    expect(result.current).toBe(true)
  })

  it('records the step once every goal is met', () => {
    const { result, rerender } = renderHook(({ allCompleted }) => useStepCompletion(3, 'practice', allCompleted), {
      initialProps: { allCompleted: false },
    })
    expect(result.current).toBe(false)

    rerender({ allCompleted: true })

    expect(result.current).toBe(true)
    expect(useProgressStore.getState().isStepCompleted(3, 'practice')).toBe(true)
  })
})
