import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const CONFLICT_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'story.md': 'story\n', 'notes.md': 'notes\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'story.md': 'theirs\n' } },
    { run: 'git commit -am "Theirs"' },
    { run: 'git switch main' },
    { write: { 'story.md': 'ours\n' } },
    { run: 'git commit -am "Ours"' },
    { run: 'git merge feature', allowFailure: true },
    { write: { 'story.md': 'resolved\n', 'notes.md': 'notes2\n' } },
    { run: 'git add story.md' },
  ],
}

describe('git commit --amend during a merge', () => {
  it('refuses and changes nothing', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    const before = await sandbox.snapshot()

    expect(await textOf(sandbox, 'git commit --amend -m x notes.md')).toBe(
      'fatal: You are in the middle of a merge -- cannot amend.',
    )
    expect(await textOf(sandbox, 'git commit --amend --no-edit')).toBe(
      'fatal: You are in the middle of a merge -- cannot amend.',
    )

    const after = await sandbox.snapshot()
    expect(after.headMessage).toBe('Ours')
    expect(after.mergeInProgress).toBe(true)
    expect(after.staged).toEqual(before.staged)
    expect(after.unstaged).toEqual(before.unstaged)
  })
})
