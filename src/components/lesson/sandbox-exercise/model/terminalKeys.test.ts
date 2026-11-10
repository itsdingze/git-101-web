import { describe, expect, it } from 'vitest'
import { terminalKeyAction } from './terminalKeys'

const plain = { shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }

describe('terminalKeyAction', () => {
  it('maps the terminal keys to their actions', () => {
    expect(terminalKeyAction({ ...plain, key: 'Tab' })).toBe('complete')
    expect(terminalKeyAction({ ...plain, key: 'ArrowUp' })).toBe('previous')
    expect(terminalKeyAction({ ...plain, key: 'ArrowDown' })).toBe('next')
    expect(terminalKeyAction({ ...plain, key: 'Enter' })).toBe('submit')
    expect(terminalKeyAction({ ...plain, key: 'Escape' })).toBe('leave')
  })

  it('leaves Tab with a modifier to the browser, so Shift+Tab still moves focus', () => {
    expect(terminalKeyAction({ ...plain, key: 'Tab', shiftKey: true })).toBeNull()
    expect(terminalKeyAction({ ...plain, key: 'Tab', ctrlKey: true })).toBeNull()
  })

  it('treats Ctrl+C as cancelling the line, whichever case the key reports', () => {
    expect(terminalKeyAction({ ...plain, key: 'c', ctrlKey: true })).toBe('cancel')
    expect(terminalKeyAction({ ...plain, key: 'C', ctrlKey: true })).toBe('cancel')
  })

  it('leaves other C shortcuts to the browser', () => {
    expect(terminalKeyAction({ ...plain, key: 'c', metaKey: true })).toBeNull()
    expect(terminalKeyAction({ ...plain, key: 'c', ctrlKey: true, shiftKey: true })).toBeNull()
  })

  it('ignores typing', () => {
    expect(terminalKeyAction({ ...plain, key: 'g' })).toBeNull()
  })
})
