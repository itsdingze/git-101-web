import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

describe('popping a stash onto a branch that did not grow from its base', () => {
  it('brings back only the stashed change, not the other branch', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'echo b > b',
      'git add .',
      'git commit -m c1',
      'git switch -c f',
      'echo af > a',
      'echo g > g',
      'git add .',
      'git commit -m f1',
      'echo b2 > b',
      'git stash',
      'git switch main',
    ])

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('\tmodified:   b')
    expect(output).toMatch(/Dropped refs\/stash@\{0\}/)
    expect(await textOf(sandbox, 'git status -s')).toBe(' M b')
    expect(await textOf(sandbox, 'cat a')).toBe('a')
    expect(await textOf(sandbox, 'cat b')).toBe('b2')
  })

  it('reports a modify/delete conflict when the stashed file is not on this branch', async () => {
    const sandbox = await playedFrom([
      'git init',
      'echo a > a',
      'git add .',
      'git commit -m c1',
      'git switch -c f',
      'echo g > g',
      'git add .',
      'git commit -m f1',
      'echo g2 > g',
      'git stash',
      'git switch main',
    ])

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain(
      'CONFLICT (modify/delete): g deleted in Updated upstream and modified in Stashed changes.  Version Stashed changes of g left in tree.',
    )
    expect(output).toContain('\tdeleted by us:   g')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'git status -s')).toBe('DU g')
    expect(await textOf(sandbox, 'cat g')).toBe('g2')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })
})
