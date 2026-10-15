import { describe, expect, it } from 'vitest'
import { NO_HINTS_SHOWN, nextHint } from './hintProgress'

describe('nextHint', () => {
  it('starts each goal at its first hint', () => {
    expect(nextHint(NO_HINTS_SHOWN, 'stage').index).toBe(0)
  })

  it('moves to the next hint when asked again for the same goal', () => {
    const first = nextHint(NO_HINTS_SHOWN, 'stage')
    const second = nextHint(first.progress, 'stage')

    expect(second.index).toBe(1)
  })

  it('starts over at the first hint when the goal changes', () => {
    const first = nextHint(NO_HINTS_SHOWN, 'stage')
    const second = nextHint(first.progress, 'stage')

    expect(nextHint(second.progress, 'commit').index).toBe(0)
  })
})
