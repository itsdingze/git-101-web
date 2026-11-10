import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const REMOTE_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [{ write: { 'f.txt': 'one\n' } }, { run: 'git add .' }, { run: 'git commit -m "Initial commit"' }],
  },
}

describe('renaming a branch', () => {
  it('renames the checked out branch and stays on it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch -M trunk')).toBe('')

    expect(await textOf(sandbox, 'git branch')).toBe('* trunk')
    expect(await textOf(sandbox, 'git status')).toContain('On branch trunk')
  })

  it('treats renaming to the same name as nothing to do', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch -M main')).toBe('')
    expect(await textOf(sandbox, 'git branch')).toBe('* main')
  })

  it('renames a named branch', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch old')

    expect(await textOf(sandbox, 'git branch -m old new')).toBe('')

    expect(await textOf(sandbox, 'git branch')).toBe('* main\n  new')
  })

  it('refuses a missing branch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch -m nope x')).toBe("fatal: no branch named 'nope'")
  })

  it('refuses to overwrite with -m', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch taken')

    expect(await textOf(sandbox, 'git branch -m taken')).toBe("fatal: a branch named 'taken' already exists")
    expect(await textOf(sandbox, 'git branch')).toBe('* main\n  taken')
  })

  it('overwrites with -M', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch taken')

    expect(await textOf(sandbox, 'git branch -M taken')).toBe('')

    expect(await textOf(sandbox, 'git branch')).toBe('* taken')
  })

  it('renames an unborn branch', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })

    expect(await textOf(sandbox, 'git branch -M trunk')).toBe('')

    expect(await textOf(sandbox, 'git status')).toContain('On branch trunk')
  })

  it('keeps tracking through the rename', async () => {
    const sandbox = await createSandbox(REMOTE_SEED)

    await sandbox.run('git branch -m renamed')

    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/main'.")
  })

  it('refuses a reserved name', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch -m HEAD')).toBe("fatal: 'HEAD' is not a valid branch name")
  })
})

describe('copying a branch', () => {
  it('copies the checked out branch without moving to it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch -c cp')).toBe('')

    expect(await textOf(sandbox, 'git branch')).toBe('  cp\n* main')
  })

  it('copies a named branch', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch old')

    await sandbox.run('git branch -c old cp')

    expect(await textOf(sandbox, 'git branch')).toBe('  cp\n* main\n  old')
  })

  it('refuses to overwrite with -c', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch cp')

    expect(await textOf(sandbox, 'git branch -c cp')).toBe("fatal: a branch named 'cp' already exists")
  })

  it('overwrites with -C', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch cp')

    expect(await textOf(sandbox, 'git branch -C main cp')).toBe('')
  })

  it('copies tracking too', async () => {
    const sandbox = await createSandbox(REMOTE_SEED)

    await sandbox.run('git branch -c cp')
    await sandbox.run('git switch cp')

    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/main'.")
  })
})

describe('reserved branch names', () => {
  it('refuses to create a branch called HEAD', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch HEAD')).toBe("fatal: 'HEAD' is not a valid branch name")
    expect(await textOf(sandbox, 'git branch')).toBe('* main')
  })

  it('refuses to switch to a new branch called HEAD', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch -c HEAD')).toBe("fatal: 'HEAD' is not a valid branch name")
  })
})
