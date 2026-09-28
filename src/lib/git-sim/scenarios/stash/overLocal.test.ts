import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of ['git init', 'echo a > a', 'echo b > b', 'git add .', 'git commit -m c1', ...lines]) {
    await sandbox.run(line)
  }
  return sandbox
}

describe('git stash apply over local changes, matched to git 2.51', () => {
  it('applies when the staged file already matches the stash', async () => {
    const sandbox = await playedFrom(['echo n > n', 'git add n', 'git stash', 'echo n > n', 'git add n'])

    const output = await textOf(sandbox, 'git stash apply')

    expect(output).not.toContain('error:')
    expect(await textOf(sandbox, 'git status -s')).toBe('A  n')
  })

  it('applies a stashed deletion over a file already deleted', async () => {
    const sandbox = await playedFrom(['rm b', 'git stash', 'rm b'])

    expect(await textOf(sandbox, 'git stash apply')).not.toContain('error:')
    expect(await textOf(sandbox, 'git status -s')).toBe(' D b')
  })

  it('brings a stashed edit back over a file deleted but not staged', async () => {
    const sandbox = await playedFrom(['echo b2 > b', 'git stash', 'rm b'])

    expect(await textOf(sandbox, 'git stash apply')).not.toContain('error:')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M b')
    expect(await textOf(sandbox, 'cat b')).toBe('b2')
  })

  it('reports a deleted-by-us conflict when the deletion is staged', async () => {
    const sandbox = await playedFrom(['echo b2 > b', 'git stash', 'git rm -q b'])

    const output = await textOf(sandbox, 'git stash apply')

    expect(output).toContain(
      'CONFLICT (modify/delete): b deleted in Updated upstream and modified in Stashed changes.  Version Stashed changes of b left in tree.',
    )
    expect(await textOf(sandbox, 'git status -s')).toBe('DU b')
    expect(await textOf(sandbox, 'cat b')).toBe('b2')
  })

  it('cannot write the index while a merge conflict is unresolved', async () => {
    const sandbox = await playedFrom([
      'echo b2 > b',
      'git stash',
      'git switch -c f',
      'echo af > a',
      'git commit -am f',
      'git switch main',
      'echo am > a',
      'git commit -am m',
      'git merge f',
    ])

    expect(await textOf(sandbox, 'git stash apply')).toBe('error: could not write index\na: needs merge')
    expect(await textOf(sandbox, 'git status -s')).toBe('UU a')
  })

  it('says the index was not unstashed when --index stops on a conflict', async () => {
    const sandbox = await playedFrom(['echo a2 > a', 'git add a', 'echo b2 > b', 'git stash', 'echo b3 > b', 'git commit -am b3'])

    const output = await textOf(sandbox, 'git stash apply --index')

    expect(output).toContain('CONFLICT (content): Merge conflict in b\nIndex was not unstashed.')
    expect(await textOf(sandbox, 'git status -s')).toBe('M  a\nUU b')
  })

  it('still refuses an unstaged edit on a file the stash changes', async () => {
    const sandbox = await playedFrom(['echo b2 > b', 'git stash', 'echo b3 > b'])

    expect(await textOf(sandbox, 'git stash apply')).toContain(
      'error: Your local changes to the following files would be overwritten by merge:\n\tb',
    )
    expect(await textOf(sandbox, 'cat b')).toBe('b3')
  })
})
