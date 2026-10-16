// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ThemeStore = typeof import('./themeStore')

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

function systemScheme(prefersDark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: prefersDark,
    addEventListener: (_type: 'change', listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: 'change', listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', () => query)
  return {
    switchTo(dark: boolean) {
      query.matches = dark
      listeners.forEach((listener) => listener())
    },
  }
}

function appliedTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

let store: ThemeStore

beforeEach(async () => {
  vi.stubGlobal('localStorage', memoryStorage())
  systemScheme(false)
  vi.resetModules()
  store = await import('./themeStore')
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('theme store', () => {
  it('follows the system until a theme is chosen', () => {
    expect(store.readThemeChoice()).toBe('system')
  })

  it('remembers the chosen theme', () => {
    store.chooseTheme('dark')

    expect(store.readThemeChoice()).toBe('dark')
  })

  it('ignores a stored value it does not know', () => {
    localStorage.setItem('git-101-theme', 'sepia')

    expect(store.readThemeChoice()).toBe('system')
  })

  it('keeps the choice in memory when storage is blocked', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    store.chooseTheme('light')

    expect(store.readThemeChoice()).toBe('light')
  })

  it('tells subscribers when the choice changes', () => {
    const listener = vi.fn()
    const unsubscribe = store.subscribeToThemeChoice(listener)

    store.chooseTheme('dark')
    unsubscribe()
    store.chooseTheme('light')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('applies an explicit choice to the page', () => {
    store.chooseTheme('dark')

    expect(appliedTheme()).toBe('dark')
  })

  it('switches the page back to light', () => {
    store.chooseTheme('dark')
    store.chooseTheme('light')

    expect(appliedTheme()).toBe('light')
  })

  it('applies the system theme when the choice is system', () => {
    systemScheme(true)

    store.chooseTheme('system')

    expect(appliedTheme()).toBe('dark')
  })

  it('switches with the system while following it', () => {
    const system = systemScheme(false)
    store.chooseTheme('system')
    const stopWatching = store.watchSystemTheme()

    system.switchTo(true)
    stopWatching()

    expect(appliedTheme()).toBe('dark')
  })

  it('keeps an explicit choice when the system switches', () => {
    const system = systemScheme(false)
    store.chooseTheme('light')
    const stopWatching = store.watchSystemTheme()

    system.switchTo(true)
    stopWatching()

    expect(appliedTheme()).toBe('light')
  })
})
