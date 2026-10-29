// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { useSandboxSession } from './useSandboxSession'

vi.mock('@/lib/git-sim/createSandbox', () => ({
  createSandbox: vi.fn(() => Promise.resolve({})),
}))

const SEED: SandboxSeed = { dir: 'todo-app' }
const LESSON = 2
const showOpening = vi.fn()
const prepare = vi.fn(() => Promise.resolve(showOpening))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useSandboxSession', () => {
  it('reports a failure instead of setting up forever when the sandbox cannot be created', async () => {
    vi.mocked(createSandbox).mockRejectedValueOnce(new Error('chunk failed'))

    const { result } = renderHook(() => useSandboxSession(SEED, LESSON, prepare))

    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.ready).toBe(false)
  })

  it('reports a failure when preparing the sandbox fails', async () => {
    prepare.mockRejectedValueOnce(new Error('snapshot failed'))

    const { result } = renderHook(() => useSandboxSession(SEED, LESSON, prepare))

    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(showOpening).not.toHaveBeenCalled()
  })

  it('drops the failure once a later setup succeeds without a retry', async () => {
    const failing = vi.fn(() => Promise.reject(new Error('snapshot failed')))
    const { result, rerender } = renderHook(({ ready }) => useSandboxSession(SEED, LESSON, ready), {
      initialProps: { ready: failing as typeof prepare },
    })
    await waitFor(() => expect(result.current.failed).toBe(true))

    rerender({ ready: prepare })

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.failed).toBe(false)
  })

  it('sets the sandbox up again on retry and becomes ready', async () => {
    vi.mocked(createSandbox).mockRejectedValueOnce(new Error('chunk failed'))
    const { result } = renderHook(() => useSandboxSession(SEED, LESSON, prepare))
    await waitFor(() => expect(result.current.failed).toBe(true))

    act(() => result.current.retry())

    expect(result.current.failed).toBe(false)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(showOpening).toHaveBeenCalledOnce()
  })
})
