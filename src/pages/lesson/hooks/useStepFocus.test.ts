// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useStepFocus } from './useStepFocus'

function stepContent() {
  const element = document.createElement('div')
  element.tabIndex = -1
  document.body.append(element)
  return { current: element }
}

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('useStepFocus', () => {
  it('moves focus to the new step and scrolls to the top on every step change', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const content = stepContent()
    const { rerender } = renderHook(({ step }) => useStepFocus(content, step), { initialProps: { step: 0 } })
    content.current.blur()

    rerender({ step: 1 })

    expect(document.activeElement).toBe(content.current)
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })
})
