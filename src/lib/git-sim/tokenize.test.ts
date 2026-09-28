import { describe, expect, it } from 'vitest'
import { parseLine } from './tokenize'

describe('quoted values', () => {
  it('keeps a quoted value joined to its option in one token', () => {
    expect(parseLine('git commit -m"Add g"').tokens).toEqual(['git', 'commit', '-mAdd g'])
    expect(parseLine("git commit -m'Add g'").tokens).toEqual(['git', 'commit', '-mAdd g'])
  })

  it('keeps a spaced quoted value in its own token', () => {
    expect(parseLine('git commit -m "Add g"').tokens).toEqual(['git', 'commit', '-m', 'Add g'])
  })

  it('keeps an empty quoted value as an empty token', () => {
    expect(parseLine('git commit -m ""').tokens).toEqual(['git', 'commit', '-m', ''])
  })
})
