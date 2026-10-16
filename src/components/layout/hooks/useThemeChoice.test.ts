// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useThemeChoice } from './useThemeChoice'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('useThemeChoice', () => {
  it('starts by following the system', () => {
    const { result } = renderHook(useThemeChoice)

    expect(result.current[0]).toBe('system')
  })

  it('reports a new choice after choosing it', () => {
    const { result } = renderHook(useThemeChoice)

    act(() => result.current[1]('dark'))

    expect(result.current[0]).toBe('dark')
  })
})
