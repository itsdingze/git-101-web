import { describe, expect, it } from 'vitest'
import { alignShellComments, splitShellComment } from './shellComment'

describe('splitShellComment', () => {
  it('separates a note that follows two or more spaces', () => {
    expect(splitShellComment('git init    # turn the folder into a repository')).toEqual({
      code: 'git init',
      comment: '    # turn the folder into a repository',
    })
  })

  it('treats a whole-line note as all comment', () => {
    expect(splitShellComment('# Secret settings')).toEqual({ code: '', comment: '# Secret settings' })
    expect(splitShellComment('  # indented note')).toEqual({ code: '', comment: '  # indented note' })
  })

  it('leaves a hash inside quotes alone', () => {
    expect(splitShellComment('git commit -m "Fix  #12 today"')).toEqual({
      code: 'git commit -m "Fix  #12 today"',
      comment: '',
    })
    expect(splitShellComment("echo 'a  # b'  # note")).toEqual({ code: "echo 'a  # b'", comment: '  # note' })
  })

  it('treats a single space then "# " as a note, as in aligned recap columns', () => {
    expect(splitShellComment('git config --global user.email "..." # set your email')).toEqual({
      code: 'git config --global user.email "..."',
      comment: ' # set your email',
    })
  })

  it('keeps a hash with a single space before it, or none, as code', () => {
    expect(splitShellComment('echo a #b')).toEqual({ code: 'echo a #b', comment: '' })
    expect(splitShellComment('stash@{0}#x')).toEqual({ code: 'stash@{0}#x', comment: '' })
  })

  it('returns lines without notes unchanged', () => {
    expect(splitShellComment('git status')).toEqual({ code: 'git status', comment: '' })
    expect(splitShellComment('')).toEqual({ code: '', comment: '' })
  })
})

describe('alignShellComments', () => {
  it('lines up trailing notes two spaces after the longest command', () => {
    expect(alignShellComments(['git diff                # changed', 'git diff --staged        # staged', 'git log   # history'])).toEqual([
      { code: 'git diff', comment: '           # changed' },
      { code: 'git diff --staged', comment: '  # staged' },
      { code: 'git log', comment: '            # history' },
    ])
  })

  it('leaves lines without a note and whole-line notes alone', () => {
    expect(alignShellComments(['# Section', 'git status', 'git add .   # stage'])).toEqual([
      { code: '', comment: '# Section' },
      { code: 'git status', comment: '' },
      { code: 'git add .', comment: '  # stage' },
    ])
  })

  it('measures a leading tab as the four columns the site renders it as', () => {
    expect(alignShellComments(['\tsettings.txt  # tabbed', 'git status  # plain'])).toEqual([
      { code: '\tsettings.txt', comment: '  # tabbed' },
      { code: 'git status', comment: '        # plain' },
    ])
  })

  it('lines up notes after long prompt lines too', () => {
    const long = '~/todo-app (main) $ echo "show_due(tasks)" > try-dates.txt'
    const short = '~/todo-app (main) $ cat .gitignore'
    expect(alignShellComments([`${long}  # long`, `${short}  # short`])).toEqual([
      { code: long, comment: '  # long' },
      { code: short, comment: `${' '.repeat(long.length - short.length + 2)}# short` },
    ])
  })
})
