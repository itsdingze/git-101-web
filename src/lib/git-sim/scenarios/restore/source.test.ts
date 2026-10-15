import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const TWO_COMMITS: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { a: 'a1\n' } },
    { run: 'git add .' },
    { run: 'git commit -m c1' },
    { write: { a: 'a2\n', b: 'b\n' } },
    { run: 'git add .' },
    { run: 'git commit -m c2' },
  ],
}

describe('git restore --source', () => {
  it('changes only the folder by default', async () => {
    const sandbox = await createSandbox(TWO_COMMITS)

    await sandbox.run('git restore --source=HEAD~1 a')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M a')
    expect(await textOf(sandbox, 'cat a')).toBe('a1')
  })

  it('changes only the staging area with --staged, in either spelling', async () => {
    const sandbox = await createSandbox(TWO_COMMITS)

    await sandbox.run('git restore --source HEAD~1 --staged a')
    expect(await textOf(sandbox, 'git status -s')).toBe('MM a')
    expect(await textOf(sandbox, 'cat a')).toBe('a2')
  })

  it('changes both with --staged --worktree', async () => {
    const sandbox = await createSandbox(TWO_COMMITS)

    await sandbox.run('git restore -s HEAD~1 --staged --worktree a')
    expect(await textOf(sandbox, 'git status -s')).toBe('M  a')
  })

  it('removes a file the source commit does not have', async () => {
    const sandbox = await createSandbox(TWO_COMMITS)

    await sandbox.run('git restore --source=HEAD~1 b')
    expect(await textOf(sandbox, 'git status -s')).toBe(' D b')
  })

  it('names a source it cannot find', async () => {
    const sandbox = await createSandbox(TWO_COMMITS)

    expect(await textOf(sandbox, 'git restore --source=nope a')).toBe('fatal: could not resolve nope')
  })
})
