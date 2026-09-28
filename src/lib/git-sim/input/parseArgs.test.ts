import { describe, expect, it } from 'vitest'
import { flagValue, hasFlag, operandsOf, unknownFlags } from './parseArgs'

describe('short options that take a value', () => {
  it('reads a value joined to the option letter', () => {
    expect(flagValue(['-bfeature'], '-b', '-B', '--branch')).toBe('feature')
    expect(flagValue(['-cnavbar'], '-c', '--create', '-C')).toBe('navbar')
    expect(flagValue(['-mfix'], '-m', '--message')).toBe('fix')
    expect(flagValue(['-mInitial'], '-m', '--message')).toBe('Initial')
    expect(flagValue(['-n5'], '-n', '--max-count')).toBe('5')
  })

  it('reads a value from the next argument when nothing is joined', () => {
    expect(flagValue(['-b', 'feature'], '-b', '-B', '--branch')).toBe('feature')
    expect(flagValue(['-m', 'fix'], '-m', '--message')).toBe('fix')
    expect(flagValue(['--message=Hello'], '--message')).toBe('Hello')
  })

  it('reads a quoted value that the shell joined to the option', () => {
    expect(flagValue(['-mAdd g'], '-m', '--message')).toBe('Add g')
    expect(flagValue(['-mAdd the gallery'], '-m', '--message')).toBe('Add the gallery')
  })

  it('does not read a joined value as further flags', () => {
    expect(hasFlag(['-mfix'], '-a', '--all')).toBe(false)
    expect(flagValue(['-mfix'], '-b', '-B', '--branch')).toBeUndefined()
  })

  it('has no value when the option ends the line', () => {
    expect(flagValue(['-m'], '-m', '--message')).toBeUndefined()
  })
})

describe('bundled short flags', () => {
  it('expands a bundle into its separate flags', () => {
    expect(hasFlag(['-am'], '-a')).toBe(true)
    expect(hasFlag(['-am'], '-m')).toBe(true)
    expect(hasFlag(['-uf'], '-u')).toBe(true)
    expect(hasFlag(['-uf'], '-f')).toBe(true)
  })

  it('reads the value that follows a bundle', () => {
    expect(flagValue(['-am', 'Tweak the copy'], '-m')).toBe('Tweak the copy')
    expect(flagValue(['-am', 'Second'], '-m', '--message')).toBe('Second')
    expect(operandsOf(['-am', 'Tweak the copy'])).toEqual(['Tweak the copy'])
  })

  it('reads an attached message as a value rather than as more flags', () => {
    expect(hasFlag(['-madd the header'], '-a', '--all')).toBe(false)
    expect(hasFlag(['-mall set'], '-a', '--all')).toBe(false)
    expect(hasFlag(['push', '-munstash it'], '-u', '--include-untracked')).toBe(false)
    expect(flagValue(['-madd the header'], '-m', '--message')).toBe('add the header')
  })

  it('expands a bundle that follows a boolean flag', () => {
    expect(hasFlag(['--amend', '-am', 'Reworded'], '-a', '--all')).toBe(true)
    expect(flagValue(['--amend', '-am', 'Reworded'], '-m', '--message')).toBe('Reworded')
    expect(flagValue(['--no-edit', '-am', 'Reworded'], '-m', '--message')).toBe('Reworded')
  })

  it('never splits a long flag', () => {
    expect(hasFlag(['--amend'], '-a')).toBe(false)
    expect(hasFlag(['--all'], '-l')).toBe(false)
    expect(hasFlag(['--staged'], '-s')).toBe(false)
    expect(hasFlag(['--include-untracked'], '-u')).toBe(false)
    expect(hasFlag(['--amend'], '--amend')).toBe(true)
    expect(hasFlag(['--include-untracked'], '--include-untracked')).toBe(true)
  })

  it('matches a bundle the caller names in full', () => {
    expect(hasFlag(['-rf', 'notes'], '-f', '-rf', '-fr', '-Rf')).toBe(true)
    expect(hasFlag(['-la'], '-a', '-A', '-la', '-al')).toBe(true)
  })
})

describe('flag values that look like flags', () => {
  it('keeps a lone short flag value intact', () => {
    expect(flagValue(['-m', '-wip'], '-m')).toBe('-wip')
    expect(flagValue(['-c', '-abc'], '-c')).toBe('-abc')
  })

  it('keeps a bundled flag value intact', () => {
    expect(flagValue(['-am', '-wip'], '-m')).toBe('-wip')
    expect(flagValue(['-am', '-draft'], '-m')).toBe('-draft')
  })

  it('keeps a long flag value intact', () => {
    expect(flagValue(['--message', '-wip'], '--message')).toBe('-wip')
  })

  it('keeps a value containing spaces intact', () => {
    expect(flagValue(['-am', '-wip on the header'], '-m')).toBe('-wip on the header')
    expect(flagValue(['-m', '-wip on the header'], '-m')).toBe('-wip on the header')
  })

  it('does not report a value as a flag of its own', () => {
    expect(hasFlag(['-m', '-wip'], '-w')).toBe(false)
    expect(hasFlag(['-am', '-wip'], '-i')).toBe(false)
  })

  it('resumes expanding after the value has been consumed', () => {
    expect(hasFlag(['-m', '-wip', '-uf'], '-f')).toBe(true)
    expect(flagValue(['-m', 'note', '-am', 'later'], '-m')).toBe('note')
  })
})

describe('operands after the double-dash separator', () => {
  it('names a file whose name starts with a dash', () => {
    expect(operandsOf(['--', '-weird.txt'])).toEqual(['-weird.txt'])
    expect(operandsOf(['-A', '--', '-weird.txt', 'plain.txt'])).toEqual(['-weird.txt', 'plain.txt'])
  })

  it('still drops flags that precede the separator', () => {
    expect(operandsOf(['-f', 'a.txt', '--', 'b.txt'])).toEqual(['a.txt', 'b.txt'])
    expect(operandsOf(['--staged', '--', '-b.txt'])).toEqual(['-b.txt'])
  })

  it('drops flags when there is no separator', () => {
    expect(operandsOf(['-f', 'a.txt'])).toEqual(['a.txt'])
    expect(operandsOf(['--'])).toEqual([])
  })
})

describe('operands with declared value flags', () => {
  it('drops the value of a declared flag', () => {
    expect(operandsOf(['-am', 'note'], ['-m', '--message'])).toEqual([])
    expect(operandsOf(['-mnote'], ['-m', '--message'])).toEqual([])
    expect(operandsOf(['push', '-m', 'note'], ['-m', '--message'])).toEqual(['push'])
    expect(operandsOf(['pop'], ['-m', '--message'])).toEqual(['pop'])
  })

  it('keeps the value when the caller declares nothing', () => {
    expect(operandsOf(['-am', 'note'])).toEqual(['note'])
  })
})

describe('unknown flags', () => {
  it('reports only flags the caller does not know', () => {
    expect(unknownFlags(['--amend', '--bogus'], ['--amend'])).toEqual(['--bogus'])
    expect(unknownFlags(['--message=Hello'], ['--message'])).toEqual([])
  })

  it('stops at the double-dash separator', () => {
    expect(unknownFlags(['--', 'HEAD'], ['--no-edit'])).toEqual([])
    expect(unknownFlags(['--bogus', '--', 'HEAD'], ['--no-edit'])).toEqual(['--bogus'])
  })
})
