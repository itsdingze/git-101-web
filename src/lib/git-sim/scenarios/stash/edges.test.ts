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

describe('git stash pop edge cases, matched to git 2.51', () => {
  it('brings back a staged new file that was deleted from the folder before stashing', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'git add .',
      'git commit -m c1',
      'echo n > n',
      'git add n',
      'rm n',
      'git stash',
      'git stash pop',
    ])

    expect(await textOf(sandbox, 'git status -s')).toBe('A  n')
    expect(await textOf(sandbox, 'cat n')).toBe('n')
  })

  it('keeps a stashed deletion staged when the pop stops on a conflict', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'echo b > b',
      'git add .',
      'git commit -m c1',
      'echo a2 > a',
      'rm b',
      'git stash',
      'echo a3 > a',
      'git commit -am c2',
    ])

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('CONFLICT (content): Merge conflict in a')
    expect(output).toContain('\tdeleted:    b')
    expect(await textOf(sandbox, 'git status -s')).toBe('UU a\nD  b')
    expect(await textOf(sandbox, 'ls')).toBe('a')
  })

  it('still restores untracked files when the tracked changes are refused', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'git add .',
      'git commit -m c1',
      'echo a2 > a',
      'echo u1 > u1',
      'echo u2 > u2',
      'git stash -u',
      'echo x > u1',
      'echo dirty > a',
    ])

    const output = await textOf(sandbox, 'git stash pop')

    expect(output.indexOf('would be overwritten by merge')).toBeLessThan(output.indexOf('u1 already exists, no checkout'))
    expect(output).toContain('error: could not restore untracked files from stash')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'cat u2')).toBe('u2')
    expect(await textOf(sandbox, 'cat u1')).toBe('x')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })

  it('restores what was staged as staged with --index', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'echo b > b',
      'git add .',
      'git commit -m c1',
      'echo a2 > a',
      'git add a',
      'echo b2 > b',
      'git stash',
      'git stash pop --index',
    ])

    expect(await textOf(sandbox, 'git status -s')).toBe('M  a\n M b')
  })

  it('refuses --index when a later commit changed the staged file', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'git add .',
      'git commit -m c1',
      'echo a2 > a',
      'git add a',
      'git stash',
      'echo a3 > a',
      'git commit -am c2',
    ])

    expect(await textOf(sandbox, 'git stash pop --index')).toBe(
      [
        'error: patch failed: a:1',
        'error: a: patch does not apply',
        'error: conflicts in index. Try without --index.',
        'The stash entry is kept in case you need it again.',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })

  it('restores the staged file with --index when a later commit changed a different file', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'echo b > b',
      'git add .',
      'git commit -m c1',
      'echo a2 > a',
      'git add a',
      'git stash',
      'echo b3 > b',
      'git commit -am c2',
      'git stash pop --index',
    ])

    expect(await textOf(sandbox, 'git status -s')).toBe('M  a')
  })
})
