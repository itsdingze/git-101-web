import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

const FOLDER_BECAME_FILE = [
  'git init',
  'mkdir notes',
  'echo a > notes/a',
  'echo r > r',
  'echo s > s',
  'git add .',
  'git commit -m c1',
  'rm -r notes',
  'echo x > notes',
  'echo r2 > r',
  'echo s2 > s',
]

describe('git stash when a tracked folder was replaced by a file, matched to git 2.51', () => {
  it('saves the stash and puts the committed folder back', async () => {
    const sandbox = await playedFrom(FOLDER_BECAME_FILE)

    expect(await textOf(sandbox, 'git stash')).toMatch(/^Saved working directory and index state WIP on main: /)
    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat notes/a')).toBe('a')
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}: WIP on main: /)
  })

  it('brings every shelved change back on pop', async () => {
    const sandbox = await playedFrom([...FOLDER_BECAME_FILE, 'git stash'])

    await sandbox.run('git stash pop')

    expect(await textOf(sandbox, 'git status -s')).toBe(' D notes/a\n M r\n M s')
    expect(await textOf(sandbox, 'cat r')).toBe('r2')
  })

  it('shelves only the named path and leaves the rest of the folder alone', async () => {
    const sandbox = await playedFrom(FOLDER_BECAME_FILE)

    expect(await textOf(sandbox, 'git stash -- r')).toMatch(/^Saved working directory and index state WIP on main: /)
    expect(await textOf(sandbox, 'git status -s')).toBe(' D notes/a\n M s\n?? notes')
    expect(await textOf(sandbox, 'cat notes')).toBe('x')
    expect(await textOf(sandbox, 'cat r')).toBe('r')
    expect(await textOf(sandbox, 'cat s')).toBe('s2')
  })
})

describe('git stash when a tracked file was replaced by a folder', () => {
  it('shelves without leaking a read error', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo n > notes',
      'echo r > r',
      'git add .',
      'git commit -m c1',
      'rm notes',
      'mkdir notes',
      'echo x > notes/inner',
      'echo r2 > r',
    ])

    const output = await textOf(sandbox, 'git stash')

    expect(output).not.toMatch(/EISDIR|multiple errors/)
    expect(output).toMatch(/^Saved working directory and index state WIP on main: /)
    expect(await textOf(sandbox, 'cat r')).toBe('r')
    expect(await textOf(sandbox, 'cat notes')).toBe('n')

    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M r')
  })
})
