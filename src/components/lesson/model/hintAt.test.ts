import { describe, expect, it } from 'vitest'
import { hintAt } from './hintAt'

const HINTS = ['Start with `git`.', 'Then `add`.', 'Name the file.']

describe('hintAt', () => {
  it('gives the hint at that position', () => {
    expect(hintAt(HINTS, 1)).toBe('Then `add`.')
  })

  it('keeps showing the last hint once the learner has seen them all', () => {
    expect(hintAt(HINTS, 7)).toBe('Name the file.')
  })

  it('gives nothing when there are no hints', () => {
    expect(hintAt([], 0)).toBe('')
  })
})
