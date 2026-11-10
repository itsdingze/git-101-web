import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function untrackedFolders(): Promise<Sandbox> {
  return createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
      { write: { 'sub/inner/a.txt': 'a\n', 'sub/b.txt': 'b\n' } },
    ],
  })
}

describe('git status with a path over untracked folders', () => {
  it.each([
    ['git status -s', '?? sub/'],
    ['git status -s sub', '?? sub/'],
    ['git status -s sub/', '?? sub/'],
    ['git status -s sub/inner', '?? sub/inner/'],
    ['git status -s sub/inner/', '?? sub/inner/'],
    ['git status -s sub/inner/a.txt', '?? sub/inner/a.txt'],
    ["git status -s '*.txt'", '?? sub/b.txt\n?? sub/inner/a.txt'],
    ["git status -s 'sub/*'", '?? sub/'],
    ['git status -s .', '?? sub/'],
  ])('%s prints %s', async (line, expected) => {
    const sandbox = await untrackedFolders()

    expect(await textOf(sandbox, line)).toBe(expected)
  })

  it.each([
    ['git status -s inner', '?? inner/'],
    ['git status -s inner/a.txt', '?? inner/a.txt'],
    ['git status -s .', '?? ./'],
    ['git status -s', '?? ./'],
    ['git status -s ..', '?? ./'],
  ])('from a subfolder, %s prints %s', async (line, expected) => {
    const sandbox = await untrackedFolders()
    await sandbox.run('cd sub')

    expect(await textOf(sandbox, line)).toBe(expected)
  })

  it('collapses below a named folder in the long format too', async () => {
    const sandbox = await untrackedFolders()

    expect(await textOf(sandbox, 'git status sub/inner')).toContain('\tsub/inner/\n')
  })
})
