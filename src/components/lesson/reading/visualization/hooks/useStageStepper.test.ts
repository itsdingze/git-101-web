// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useStageStepper } from './useStageStepper'

afterEach(cleanup)

describe('useStageStepper', () => {
  it('steps forward and back within the stages', () => {
    const { result } = renderHook(() => useStageStepper(3))
    expect(result.current).toMatchObject({ index: 0, atStart: true, atEnd: false })

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current).toMatchObject({ index: 2, atStart: false, atEnd: true })

    act(() => result.current.previous())
    expect(result.current.index).toBe(1)
  })

  it('never steps back before the first stage', () => {
    const { result } = renderHook(() => useStageStepper(3))

    act(() => result.current.previous())

    expect(result.current.index).toBe(0)
  })

  it('starts over from the first stage', () => {
    const { result } = renderHook(() => useStageStepper(3))
    act(() => result.current.next())

    act(() => result.current.reset())

    expect(result.current.index).toBe(0)
  })
})
