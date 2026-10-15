// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useModalDialog } from './useModalDialog'

function Dialog({ onClose }: { onClose: () => void }) {
  const { dialogRef, closeOnBackdrop } = useModalDialog(onClose)
  return createElement('dialog', { ref: dialogRef, onClick: closeOnBackdrop, 'aria-label': 'Sheet' },
    createElement('p', null, 'Inside'),
  )
}

const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
})

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = showModal
})

afterEach(() => {
  cleanup()
  showModal.mockClear()
})

describe('useModalDialog', () => {
  it('opens the dialog as a modal and locks page scrolling until it closes', () => {
    const { unmount } = render(createElement(Dialog, { onClose: vi.fn() }))

    expect(showModal).toHaveBeenCalledOnce()
    expect(document.documentElement.style.overflow).toBe('hidden')

    unmount()

    expect(document.documentElement.style.overflow).toBe('')
  })

  it('closes on a click on the backdrop, but not inside the dialog', () => {
    const onClose = vi.fn()
    render(createElement(Dialog, { onClose }))

    fireEvent.click(screen.getByText('Inside'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('dialog', { hidden: true }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
