import { describe, expect, it } from 'vitest'
import { slotTone } from './slotTone'

const open = { selected: 1, correctSlot: 2, completed: false, wrong: false }

describe('slotTone', () => {
  it('leaves unselected options plain', () => {
    expect(slotTone(0, open)).toBe('idle')
  })

  it('marks the selected option before it is checked', () => {
    expect(slotTone(1, open)).toBe('selected')
  })

  it('marks the selected option wrong after a wrong check', () => {
    expect(slotTone(1, { ...open, wrong: true })).toBe('wrong')
  })

  it('marks the right answer once the quiz is complete', () => {
    expect(slotTone(2, { ...open, selected: 2, completed: true })).toBe('correct')
    expect(slotTone(0, { ...open, selected: 2, completed: true })).toBe('idle')
  })
})
