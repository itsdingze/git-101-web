import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

const IGNORING_SEED: SandboxSeed = {
  ...SEED,
  setup: [
    ...(SEED.setup ?? []),
    { write: { '.gitignore': '*.log\n' } },
    { run: 'git add .gitignore' },
    { run: 'git commit -q -m ignore' },
    { write: { 'a.log': 'noise\n', 'u.txt': 'u\n' } },
  ],
}

describe('git stash --keep-index', () => {
  it('leaves staged content in place', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('f.txt', 'one\nstaged\n')
    await sandbox.run('git add f.txt')
    await sandbox.writeFile('f.txt', 'one\nstaged\nunstaged\n')

    await sandbox.run('git stash --keep-index')

    expect(await textOf(sandbox, 'git status --short')).toBe('M  f.txt')
    expect(await sandbox.readFile('f.txt')).toBe('one\nstaged\n')
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}: WIP on main:/)
  })

  it('keeps a staged new file and a staged removal', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('n.txt', 'new\n')
    await sandbox.run('git add n.txt')
    await sandbox.run('git rm -q g.txt')

    await sandbox.run('git stash -k')

    expect(await textOf(sandbox, 'git status --short')).toBe('D  g.txt\nA  n.txt')
  })
})

describe('git stash -a', () => {
  it('stashes ignored and untracked files too', async () => {
    const sandbox = await createSandbox(IGNORING_SEED)

    expect(await textOf(sandbox, 'git stash -a')).toMatch(/^Saved working directory and index state WIP on main:/)

    expect(await textOf(sandbox, 'git status --short --ignored')).toBe('')
    expect((await sandbox.snapshot()).workdirFiles).not.toContain('a.log')
  })

  it('restores them on pop', async () => {
    const sandbox = await createSandbox(IGNORING_SEED)
    await sandbox.run('git stash -a')

    await sandbox.run('git stash pop')

    expect(await textOf(sandbox, 'git status --short --ignored')).toBe('?? u.txt\n!! a.log')
    expect(await sandbox.readFile('a.log')).toBe('noise\n')
  })

  it('still reports nothing to save when nothing changed', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git stash --all')).toBe('No local changes to save')
  })
})
