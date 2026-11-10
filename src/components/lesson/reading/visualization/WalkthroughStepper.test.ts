// @vitest-environment jsdom
import { createElement, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { messages } from '@/messages/en'
import { WalkthroughStepper } from './WalkthroughStepper'

const LAST = 2

function Stepper() {
  const [index, setIndex] = useState(0)
  return createElement(WalkthroughStepper, {
    onPrev: () => setIndex((current) => current - 1),
    onNext: () => setIndex((current) => current + 1),
    atStart: index === 0,
    atEnd: index === LAST,
    children: `stage ${index}`,
  })
}

function nextButton() {
  return screen.getByRole('button', { name: messages.reading.stepper.next })
}

afterEach(cleanup)

describe('WalkthroughStepper', () => {
  it('keeps focus on Next at the last stage, so arrow keys still work', () => {
    render(createElement(Stepper))
    const next = nextButton()
    next.focus()

    fireEvent.click(next)
    fireEvent.click(next)

    expect(document.activeElement).toBe(next)
    expect(next.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(next, { key: 'ArrowLeft' })
    expect(screen.getByText('stage 1')).toBeTruthy()
  })

  it('does nothing when the unavailable direction is pressed', () => {
    const onPrev = vi.fn()
    render(createElement(WalkthroughStepper, { onPrev, onNext: () => {}, atStart: true, atEnd: false, children: 'stage' }))

    fireEvent.click(screen.getByRole('button', { name: messages.reading.stepper.previous }))

    expect(onPrev).not.toHaveBeenCalled()
  })
})
