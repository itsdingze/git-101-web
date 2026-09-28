import { describe, expect, it } from 'vitest'
import { checkOutcome } from './checkOutcome'

describe('checkOutcome', () => {
  it('marks a passing check correct', () => {
    expect(checkOutcome(true, false)).toBe('correct')
    expect(checkOutcome(true, true)).toBe('correct')
  })

  it('holds a failed check as incorrect only for steps that track an answer', () => {
    expect(checkOutcome(false, true)).toBe('incorrect')
  })

  it('leaves the footer untouched when the step explains the failure itself', () => {
    expect(checkOutcome(false, false)).toBeNull()
  })

  it('ignores a check that has nothing to say', () => {
    expect(checkOutcome(undefined, true)).toBeNull()
  })
})
