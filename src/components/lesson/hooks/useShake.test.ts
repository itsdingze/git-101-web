// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useShake } from './useShake'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useShake', () => {
  it('shakes, then settles by itself', () => {
    const { result } = renderHook(() => useShake())

    act(() => result.current.shake())
    expect(result.current.shaking).toBe(true)

    act(() => {
      vi.runAllTimers()
    })
    expect(result.current.shaking).toBe(false)
  })

  it('runs a full shake again when shaken mid-shake', () => {
    const { result } = renderHook(() => useShake())
    act(() => result.current.shake())
    act(() => {
      vi.advanceTimersByTime(300)
    })

    act(() => result.current.shake())
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.shaking).toBe(true)
  })

  it('stops at once when told to', () => {
    const { result } = renderHook(() => useShake())
    act(() => result.current.shake())

    act(() => result.current.stop())

    expect(result.current.shaking).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves no timer running after unmount', () => {
    const { result, unmount } = renderHook(() => useShake())
    act(() => result.current.shake())

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
