import { describe, expect, it } from 'vitest'
import { seededShuffle } from './seededShuffle'

const ITEMS = ['add', 'commit', 'push', 'pull', 'merge', 'rebase']

describe('seededShuffle', () => {
  it('returns every item exactly once', () => {
    expect([...seededShuffle(ITEMS, 'seed')].sort()).toEqual([...ITEMS].sort())
  })

  it('gives the same order every time for the same seed', () => {
    expect(seededShuffle(ITEMS, 'seed')).toEqual(seededShuffle(ITEMS, 'seed'))
  })

  it('keeps the original items, so callers can find one by identity', () => {
    const options = [{ text: 'a' }, { text: 'b' }, { text: 'c' }]

    expect(seededShuffle(options, 'quiz')).toContain(options[1])
  })
})
