import { describe, expect, it } from 'vitest'
import { hintAfterWrongCheck } from './hintProgress'

describe('hintAfterWrongCheck', () => {
  it('keeps the first hint waiting until the learner has opened it', () => {
    expect(hintAfterWrongCheck(0, 3, false)).toBe(0)
  })

  it('moves to the next hint after a wrong check while hints are open', () => {
    expect(hintAfterWrongCheck(0, 3, true)).toBe(1)
  })

  it('stays on the last hint', () => {
    expect(hintAfterWrongCheck(2, 3, true)).toBe(2)
    expect(hintAfterWrongCheck(0, 0, true)).toBe(0)
  })
})
