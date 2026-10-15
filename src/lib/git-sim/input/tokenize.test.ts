import { describe, expect, it } from 'vitest'
import { commandWords, parseLine } from './tokenize'

describe('command words', () => {
  it('keeps each word as typed beside its parsed text', () => {
    expect(commandWords('git commit -m "Add g" my\\ file')).toEqual([
      { text: 'git', raw: 'git', quoted: false },
      { text: 'commit', raw: 'commit', quoted: false },
      { text: '-m', raw: '-m', quoted: false },
      { text: 'Add g', raw: '"Add g"', quoted: true },
      { text: 'my file', raw: 'my\\ file', quoted: false },
    ])
  })

  it('keeps redirection operators as words so the line can be rebuilt', () => {
    expect(commandWords("echo 'hi' >> notes.txt").map((word) => word.raw)).toEqual(['echo', "'hi'", '>>', 'notes.txt'])
  })
})

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

describe('input redirection', () => {
  it('takes the file after < out of the arguments', () => {
    const parsed = parseLine('gh auth login --with-token < ~/token.txt')

    expect(parsed.tokens).toEqual(['gh', 'auth', 'login', '--with-token'])
    expect(parsed.input).toBe('~/token.txt')
    expect(parsed.redirectionMissingTarget).toBe(false)
  })

  it('reads a file joined to the <', () => {
    expect(parseLine('gh auth login --with-token <token.txt').input).toBe('token.txt')
  })

  it('keeps a quoted < as an ordinary argument', () => {
    const parsed = parseLine('git commit -m "<"')

    expect(parsed.tokens).toEqual(['git', 'commit', '-m', '<'])
    expect(parsed.input).toBeNull()
  })

  it('flags a < with no file after it', () => {
    expect(parseLine('gh auth login --with-token <').redirectionMissingTarget).toBe(true)
  })

  it('reads input and writes output in the same line', () => {
    const parsed = parseLine('gh auth status < in.txt > out.txt')

    expect(parsed.tokens).toEqual(['gh', 'auth', 'status'])
    expect(parsed.input).toBe('in.txt')
    expect(parsed.redirection).toEqual({ target: 'out.txt', append: false })
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
