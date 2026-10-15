import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const TEAM_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
  },
}

const DETACH = 'cat .git/refs/heads/main > .git/HEAD'

async function detachedSandbox(): Promise<Sandbox> {
  const sandbox = await createSandbox(TEAM_SEED)
  await sandbox.run(DETACH)
  return sandbox
}

describe('a HEAD detached by writing a commit into .git/HEAD', () => {
  it('reads as a detached HEAD', async () => {
    const sandbox = await detachedSandbox()

    expect(await textOf(sandbox, 'git status')).toMatch(/^HEAD detached at [0-9a-f]{7}$/m)
  })

  it('refuses a merge', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git switch -c feature')
    await sandbox.run('echo "more" >> README.md')
    await sandbox.run('git commit -am "Add more"')
    await sandbox.run('git switch main')
    await sandbox.run(DETACH)

    expect(await textOf(sandbox, 'git merge feature')).toBe("fatal: this course can't merge onto a detached HEAD.")
  })

  it('refuses to abort a merge it would have to put back on a branch', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git switch -c feature')
    await sandbox.run('echo "theirs" > README.md')
    await sandbox.run('git commit -am "Theirs"')
    await sandbox.run('git switch main')
    await sandbox.run('echo "ours" > README.md')
    await sandbox.run('git commit -am "Ours"')
    await sandbox.run('git merge feature')
    await sandbox.run(DETACH)

    expect(await textOf(sandbox, 'git merge --abort')).toBe("fatal: this course can't merge onto a detached HEAD.")
  })

  it('refuses a pull', async () => {
    const sandbox = await detachedSandbox()

    expect(await textOf(sandbox, 'git pull')).toBe("fatal: this course can't pull onto a detached HEAD.")
  })

  it('refuses a push', async () => {
    const sandbox = await detachedSandbox()

    expect(await textOf(sandbox, 'git push')).toBe("fatal: this course can't push a detached HEAD.")
  })

  it('refuses to stash', async () => {
    const sandbox = await detachedSandbox()
    await sandbox.run('echo "edit" > README.md')

    expect(await textOf(sandbox, 'git stash')).toBe("fatal: this course can't stash on a detached HEAD.")
  })

  it('refuses to bring back a stash made on an older commit', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('echo "edit" > README.md')
    await sandbox.run('git stash')
    await sandbox.run('echo "notes" > notes.md')
    await sandbox.run('git add notes.md')
    await sandbox.run('git commit -m "Add notes"')
    await sandbox.run(DETACH)

    expect(await textOf(sandbox, 'git stash pop')).toMatch(/^fatal: this course can't apply a stash on a detached HEAD\.$/m)
  })
})
