import { describe, expect, it } from 'vitest'
import { parseCommandLine, type KnownOptions } from './commandLine'

const KNOWN: KnownOptions = {
  flags: ['-a', '--all', '-v', '--verbose', '-s', '-b', '--amend'],
  valueFlags: ['-m', '--message', '-n'],
  attachedValueFlags: ['-u', '--untracked-files', '--format'],
  trailingValueFlags: ['--contains', '--merged'],
  countShorthand: true,
}

function parse(...args: readonly string[]) {
  return parseCommandLine(args, KNOWN)
}

describe('flags a command declares', () => {
  it('reads a whole flag', () => {
    expect(parse('--amend').line.has('--amend')).toBe(true)
    expect(parse('--amend').line.has('-a')).toBe(false)
  })

  it('expands a bundle of short flags', () => {
    const { line } = parse('-sb')

    expect(line.has('-s')).toBe(true)
    expect(line.has('-b')).toBe(true)
  })

  it('counts a repeated flag', () => {
    expect(parse('-vv', '--verbose').line.count('-v', '--verbose')).toBe(3)
  })
})

describe('values', () => {
  it('reads a value from the next argument', () => {
    expect(parse('-m', 'note').line.value('-m', '--message')).toBe('note')
  })

  it('reads a value joined to a short flag', () => {
    expect(parse('-mnote').line.value('-m')).toBe('note')
  })

  it('reads a value that follows a bundle', () => {
    const { line } = parse('-am', 'note')

    expect(line.has('-a')).toBe(true)
    expect(line.value('-m')).toBe('note')
    expect(line.operands).toEqual([])
  })

  it('reads a long value after an equals sign or as the next argument', () => {
    expect(parse('--message=note').line.value('--message')).toBe('note')
    expect(parse('--message', 'note').line.value('--message')).toBe('note')
  })

  it('never reads a consumed value as an option', () => {
    const parsed = parse('-m', '-wip')

    expect(parsed.unknownOption).toBeNull()
    expect(parsed.line.value('-m')).toBe('-wip')
  })

  it('keeps every value of a repeated option in order', () => {
    expect(parse('-m', 'one', '-m', 'two').line.values('-m')).toEqual(['one', 'two'])
  })

  it('reports a value option left without its value', () => {
    expect(parse('-m').missingValue).toBe('-m')
    expect(parse('--message').missingValue).toBe('--message')
  })
})

describe('values that must be attached', () => {
  it('reads an attached value', () => {
    expect(parse('-uno').line.value('-u')).toBe('no')
    expect(parse('--untracked-files=all').line.value('--untracked-files')).toBe('all')
  })

  it('leaves the next argument as an operand', () => {
    const { line } = parse('-u', 'no')

    expect(line.has('-u')).toBe(true)
    expect(line.value('-u')).toBeUndefined()
    expect(line.operands).toEqual(['no'])
  })
})

describe('values that are only optional at the end of the line', () => {
  it('takes the next argument when there is one', () => {
    const { line } = parse('--contains', 'HEAD', 'extra')

    expect(line.value('--contains')).toBe('HEAD')
    expect(line.operands).toEqual(['extra'])
  })

  it('reads no value when the option ends the line', () => {
    const parsed = parse('--merged')

    expect(parsed.line.has('--merged')).toBe(true)
    expect(parsed.line.value('--merged')).toBeUndefined()
    expect(parsed.missingValue).toBeNull()
  })
})

describe('count shorthand', () => {
  it('reads -5 as a limit of five', () => {
    expect(parse('-5').line.value('-n')).toBe('5')
  })
})

describe('options a command does not declare', () => {
  it('names the whole token as typed', () => {
    expect(parse('--nope').unknownOption).toBe('--nope')
    expect(parse('-z').unknownOption).toBe('-z')
    expect(parse('-az').unknownOption).toBe('-az')
  })

  it('refuses a value given to a flag that takes none', () => {
    expect(parse('--amend=x').unknownOption).toBe('--amend=x')
  })
})

describe('operands', () => {
  it('keeps a lone dash as an operand', () => {
    expect(parse('-').line.operands).toEqual(['-'])
  })

  it('stops reading options after a double dash', () => {
    const parsed = parse('--', '--nope', 'a.txt')

    expect(parsed.unknownOption).toBeNull()
    expect(parsed.line.operands).toEqual(['--nope', 'a.txt'])
    expect(parsed.line.afterDashes).toEqual(['--nope', 'a.txt'])
  })

  it('separates operands before the double dash', () => {
    expect(parse('HEAD', '--', 'a.txt').line.beforeDashes).toEqual(['HEAD'])
  })
})

describe('the last of several competing options', () => {
  it('wins', () => {
    expect(parse('-a', '-v', '-a').line.lastOf('-a', '-v')).toBe('-a')
    expect(parse('-a', '-v').line.lastOf('-a', '-v')).toBe('-v')
  })

  it('is undefined when none was given', () => {
    expect(parse('-s').line.lastOf('-a', '-v')).toBeUndefined()
  })
})
