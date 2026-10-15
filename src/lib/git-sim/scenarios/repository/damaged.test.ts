import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const REPO_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

describe('a .git folder whose HEAD is not a valid ref', () => {
  it.each([
    ['an empty HEAD in a hand-made .git', { dir: 'project' }, ['mkdir .git', 'touch .git/HEAD']],
    ['junk written over HEAD', REPO_SEED, ['echo junk > .git/HEAD']],
  ])(
    'is not a repository: %s',
    async (_label, seed, vandalism) => {
      const sandbox = await createSandbox(seed)
      for (const line of vandalism) await sandbox.run(line)

      expect(await textOf(sandbox, 'git status')).toBe(
        'fatal: not a git repository (or any of the parent directories): .git',
      )
      expect((await sandbox.snapshot()).isRepo).toBe(false)
    },
  )
})

describe('a repository damaged by hand', () => {
  it('still gives a snapshot, reading as no repository', async () => {
    const sandbox = await createSandbox(REPO_SEED)
    await sandbox.run('rm -r .git/objects')

    expect((await sandbox.snapshot()).isRepo).toBe(false)
  })

  it('explains itself in plain words instead of an isomorphic-git bug report', async () => {
    const sandbox = await createSandbox(REPO_SEED)
    await sandbox.run('echo junk > .git/index')

    expect(await textOf(sandbox, 'git status')).toBe(
      'fatal: files inside .git were edited, so this repository can no longer be read. Use Start over to reset the exercise.',
    )
  })
})

describe('an empty .git folder', () => {
  it('is not a repository, so status says so and the snapshot still reads', async () => {
    const sandbox = await createSandbox({ dir: 'project' })
    await sandbox.run('mkdir .git')

    expect(await textOf(sandbox, 'git status')).toBe(
      'fatal: not a git repository (or any of the parent directories): .git',
    )
    expect((await sandbox.snapshot()).isRepo).toBe(false)
  })

  it('gets a fresh repository from git init, not a reinitialised one', async () => {
    const sandbox = await createSandbox({ dir: 'project' })
    await sandbox.run('mkdir .git')

    expect(await textOf(sandbox, 'git init')).toBe(
      'Initialized empty Git repository in /home/user/project/.git/',
    )
    expect((await sandbox.snapshot()).isRepo).toBe(true)
  })
})
