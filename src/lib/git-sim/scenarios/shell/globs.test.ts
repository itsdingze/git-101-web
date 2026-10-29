import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    {
      write: {
        'a.txt': 'a\n',
        'B.txt': 'b\n',
        'c.md': 'c\n',
        '.hidden': 'h\n',
        'sub/x.md': 'x\n',
        'sub/y.md': 'y\n',
      },
    },
  ],
}

describe('an unquoted *', () => {
  it('becomes the visible names in the current folder, in ls order', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo *')).toBe('a.txt B.txt c.md sub')
  })

  it.each([
    ['echo *.txt', 'a.txt B.txt'],
    ['echo ?.md', 'c.md'],
    ['echo .h*', '.hidden'],
    ['echo sub/*.md', 'sub/x.md sub/y.md'],
    ['echo */', 'sub/'],
    ['echo */x.md', 'sub/x.md'],
    ['echo s"u"*', 'sub'],
  ])('matches like bash in %j', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })

  it('stays as typed when nothing matches', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo *.py')).toBe('*.py')
  })

  it('works from inside a folder', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'cd sub && echo *')).toBe('x.md y.md')
  })
})

describe('a quoted or escaped *', () => {
  it.each([
    ['echo "*"', '*'],
    ["echo '*.txt'", '*.txt'],
    ['echo \\*', '*'],
    ['echo "sub/*"', 'sub/*'],
  ])('stays as typed in %j', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })
})

describe('git add with a glob', () => {
  it('stages only the files the glob names', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add *.txt')

    expect(await textOf(sandbox, 'git status --short')).toBe('A  B.txt\nA  a.txt\n?? .hidden\n?? c.md\n?? sub/')
  })

  it('leaves hidden files out of *', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add *')

    expect(await textOf(sandbox, 'git status --short')).toBe(
      'A  B.txt\nA  a.txt\nA  c.md\nA  sub/x.md\nA  sub/y.md\n?? .hidden',
    )
  })
})
