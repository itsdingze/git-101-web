import { describe, expect, it } from 'vitest'
import { commandWords, parseCommandList, type ParsedCommand } from './tokenize'

function firstCommand(line: string): ParsedCommand {
  const list = parseCommandList(line)
  if (list.kind !== 'commands') throw new Error(`expected a command, got ${list.kind}`)
  const [first] = list.commands
  if (!first) throw new Error('expected a command, got none')
  return first.command
}

function tokens(line: string): string[] {
  return firstCommand(line).words.map((word) => word.text)
}

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

  it('keeps list operators as their own words, even with no spaces around them', () => {
    expect(commandWords('cd sub&&ls;pwd || echo "a|b"').map((word) => word.raw)).toEqual([
      'cd',
      'sub',
      '&&',
      'ls',
      ';',
      'pwd',
      '||',
      'echo',
      '"a|b"',
    ])
  })
})

describe('quoted values', () => {
  it('keeps a quoted value joined to its option in one token', () => {
    expect(tokens('git commit -m"Add g"')).toEqual(['git', 'commit', '-mAdd g'])
    expect(tokens("git commit -m'Add g'")).toEqual(['git', 'commit', '-mAdd g'])
  })

  it('keeps a spaced quoted value in its own token', () => {
    expect(tokens('git commit -m "Add g"')).toEqual(['git', 'commit', '-m', 'Add g'])
  })

  it('keeps an empty quoted value as an empty token', () => {
    expect(tokens('git commit -m ""')).toEqual(['git', 'commit', '-m', ''])
  })
})

describe('input redirection', () => {
  it('takes the file after < out of the arguments', () => {
    const parsed = firstCommand('gh auth login --with-token < ~/token.txt')

    expect(parsed.words.map((word) => word.text)).toEqual(['gh', 'auth', 'login', '--with-token'])
    expect(parsed.input).toBe('~/token.txt')
  })

  it('reads a file joined to the <', () => {
    expect(firstCommand('gh auth login --with-token <token.txt').input).toBe('token.txt')
  })

  it('keeps a quoted < as an ordinary argument', () => {
    const parsed = firstCommand('git commit -m "<"')

    expect(parsed.words.map((word) => word.text)).toEqual(['git', 'commit', '-m', '<'])
    expect(parsed.input).toBeNull()
  })

  it('flags a < with no file after it', () => {
    expect(parseCommandList('gh auth login --with-token <').kind).toBe('syntax-error')
  })

  it('reads input and writes output in the same line', () => {
    const parsed = firstCommand('gh auth status < in.txt > out.txt')

    expect(parsed.words.map((word) => word.text)).toEqual(['gh', 'auth', 'status'])
    expect(parsed.input).toBe('in.txt')
    expect(parsed.redirection).toEqual({ target: 'out.txt', append: false })
  })
})

describe('backslashes, like bash', () => {
  it('escapes the next character outside quotes', () => {
    expect(tokens('mkdir my\\ notes')).toEqual(['mkdir', 'my notes'])
    expect(tokens('mkdir a\\b')).toEqual(['mkdir', 'ab'])
    expect(tokens('echo a\\>b')).toEqual(['echo', 'a>b'])
  })

  it('keeps backslashes inside single quotes and before ordinary characters in double quotes', () => {
    expect(tokens("echo 'a\\b'")).toEqual(['echo', 'a\\b'])
    expect(tokens('echo "a\\b"')).toEqual(['echo', 'a\\b'])
    expect(tokens('echo "say \\"hi\\""')).toEqual(['echo', 'say "hi"'])
  })

  it('flags a trailing backslash as a line that continues', () => {
    expect(parseCommandList('mkdir \\')).toEqual({ kind: 'continues', after: '\\' })
    expect(parseCommandList('mkdir notes').kind).toBe('commands')
  })
})
