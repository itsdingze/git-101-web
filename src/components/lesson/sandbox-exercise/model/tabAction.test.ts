import { describe, expect, it } from 'vitest'
import { tabAction } from './tabAction'

describe('tabAction', () => {
  it('fills in a completion that changes the line', () => {
    expect(tabAction('cd no', null, { line: 'cd notes/', cursor: 9, matches: ['notes/'] })).toEqual({
      type: 'replace',
      line: 'cd notes/',
      cursor: 9,
    })
  })

  it('waits on the first Tab when several matches share no longer prefix', () => {
    expect(tabAction('git sta', null, { line: 'git sta', cursor: 7, matches: ['stash', 'status'] })).toEqual({
      type: 'none',
    })
  })

  it('lists the matches on a second Tab at the same line', () => {
    expect(tabAction('git sta', 'git sta', { line: 'git sta', cursor: 7, matches: ['stash', 'status'] })).toEqual({
      type: 'list',
      matches: ['stash', 'status'],
    })
  })

  it('does nothing when nothing matches, however often Tab is pressed', () => {
    expect(tabAction('cat zzz', 'cat zzz', { line: 'cat zzz', cursor: 7, matches: [] })).toEqual({ type: 'none' })
  })
})
