import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

const UNTRACKED_EDIT = [
  'git init',
  'echo a > a',
  'echo b > b',
  'git add .',
  'git commit -m c1',
  'git branch f',
  'echo b2 > b',
  'git rm -q --cached b',
  'git stash',
]

describe('git stash of a file taken out of the index with rm --cached, matched to git 2.51', () => {
  it('shelves the edited contents and puts the committed file back', async () => {
    const sandbox = await playedFrom(UNTRACKED_EDIT)

    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat b')).toBe('b')
  })

  it('brings the edit back as an unstaged change on a plain apply', async () => {
    const sandbox = await playedFrom([...UNTRACKED_EDIT, 'git switch f'])

    await sandbox.run('git stash apply')

    expect(await textOf(sandbox, 'git status -s')).toBe(' M b')
    expect(await textOf(sandbox, 'cat b')).toBe('b2')
  })

  it('refuses to restore the untracked copy with -u because the tracked edit already brought it back', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'echo c > c',
      'git add .',
      'git commit -m c1',
      'echo c2 > c',
      'git rm -q --cached c',
      'git stash -u',
    ])

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('c already exists, no checkout\nerror: could not restore untracked files from stash')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M c')
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}: WIP on main: [0-9a-f]{7} c1$/)
  })

  it('keeps untracked files in their own parent commit, like git', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'git add .',
      'git commit -m c1',
      'echo u > u',
      'git stash -u',
    ])

    expect(await textOf(sandbox, 'git log --all --oneline')).toMatch(/untracked files on main: [0-9a-f]{7} c1/)
  })

  it('restores the staged deletion and the untracked copy with --index', async () => {
    const sandbox = await playedFrom([...UNTRACKED_EDIT, 'git switch f'])

    await sandbox.run('git stash apply --index')

    expect(await textOf(sandbox, 'git status -s')).toBe('D  b\n?? b')
    expect(await textOf(sandbox, 'cat b')).toBe('b2')
  })
})
