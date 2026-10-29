// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

function pressed(name: string) {
  return screen.getByRole('button', { name }).getAttribute('aria-pressed')
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('marks matching the system as the starting choice', () => {
    render(createElement(ThemeToggle))

    expect(pressed('System')).toBe('true')
    expect(pressed('Dark')).toBe('false')
  })

  it('switches the page to dark when Dark is pressed', () => {
    render(createElement(ThemeToggle))

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(pressed('Dark')).toBe('true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
