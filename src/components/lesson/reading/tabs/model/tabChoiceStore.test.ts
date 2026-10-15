import { afterEach, describe, expect, it, vi } from 'vitest'
import { chooseTab, readTabChoice, subscribeToTabChoices } from './tabChoiceStore'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

function blockedStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  return {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tab choice store', () => {
  it('remembers a choice across reads', () => {
    vi.stubGlobal('localStorage', memoryStorage())

    chooseTab('computer', 'Windows')

    expect(readTabChoice('computer')).toBe('Windows')
  })

  it('keeps the choice in memory when storage is blocked', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    chooseTab('shell', 'Mac')

    expect(readTabChoice('shell')).toBe('Mac')
  })

  it('has no choice for a group nobody picked', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    expect(readTabChoice('never-picked')).toBeNull()
  })

  it('tells subscribers when a choice changes, until they unsubscribe', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    const listener = vi.fn()
    const unsubscribe = subscribeToTabChoices(listener)

    chooseTab('computer', 'Mac')
    unsubscribe()
    chooseTab('computer', 'Windows')

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
