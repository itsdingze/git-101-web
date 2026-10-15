import { describe, expect, it } from 'vitest'
import { NOT_BROWSING, recall } from './commandHistory'

const HISTORY = ['git init', 'git add .', 'git commit']

describe('recall', () => {
  it('steps back from the newest command', () => {
    const newest = recall(HISTORY, NOT_BROWSING, -1)
    const older = recall(HISTORY, newest?.position ?? NOT_BROWSING, -1)

    expect(newest?.draft).toBe('git commit')
    expect(older?.draft).toBe('git add .')
  })

  it('stays on the oldest command when stepping back past it', () => {
    expect(recall(HISTORY, 0, -1)).toEqual({ position: 0, draft: 'git init' })
  })

  it('returns to an empty line after the newest command', () => {
    expect(recall(HISTORY, 2, 1)).toEqual({ position: NOT_BROWSING, draft: '' })
  })

  it('leaves an empty line empty when stepping forward without browsing', () => {
    expect(recall(HISTORY, NOT_BROWSING, 1)).toEqual({ position: NOT_BROWSING, draft: '' })
  })

  it('does nothing before any command has run', () => {
    expect(recall([], NOT_BROWSING, -1)).toBeNull()
  })
})
