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

describe('backslashes, like bash', () => {
  it('escapes the next character outside quotes', () => {
    expect(parseLine('mkdir my\\ notes').tokens).toEqual(['mkdir', 'my notes'])
    expect(parseLine('mkdir a\\b').tokens).toEqual(['mkdir', 'ab'])
    expect(parseLine('echo a\\>b').tokens).toEqual(['echo', 'a>b'])
  })

  it('keeps backslashes inside single quotes and before ordinary characters in double quotes', () => {
    expect(parseLine("echo 'a\\b'").tokens).toEqual(['echo', 'a\\b'])
    expect(parseLine('echo "a\\b"').tokens).toEqual(['echo', 'a\\b'])
    expect(parseLine('echo "say \\"hi\\""').tokens).toEqual(['echo', 'say "hi"'])
  })

  it('flags a trailing backslash as a line that continues', () => {
    expect(parseLine('mkdir \\').continuesLine).toBe(true)
    expect(parseLine('mkdir notes').continuesLine).toBe(false)
  })
})
