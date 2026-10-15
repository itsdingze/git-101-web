import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const REMOTE_URL = 'https://github.com/team/project.git'

const TEAM_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [{ write: { 'notes.md': 'from a teammate\n' } }, { run: 'git add .' }, { run: 'git commit -m "Add notes"' }],
  },
}

describe("the remote's storage", () => {
  it('stays out of the home folder listing', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')

    expect(await textOf(sandbox, 'ls -a')).toBe('.  ..  project')
  })

  it("can't be entered, read, or deleted from the shell", async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')

    expect(await textOf(sandbox, 'cd .remotes')).toBe('bash: cd: .remotes: No such file or directory')
    expect(await textOf(sandbox, 'cat .remotes/origin/README.md')).toMatch(/No such file or directory/)
    expect(await textOf(sandbox, 'rm -r .remotes')).toMatch(/No such file or directory/)
  })

  it('still takes pushes and serves pulls', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git pull')
    await sandbox.run('echo "mine" > mine.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add mine"')

    expect(await textOf(sandbox, 'cat notes.md')).toBe('from a teammate')
    expect(await textOf(sandbox, 'git push')).toMatch(/main -> main/)
    expect(await textOf(sandbox, 'git status')).toMatch(/up to date with 'origin\/main'/)
  })
})
