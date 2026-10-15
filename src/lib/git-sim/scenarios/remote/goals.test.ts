import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { meets } from '@/lib/git-sim/scenarios/goalFixtures'

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
  },
}

async function featureCommitted(): Promise<Sandbox> {
  const sandbox = await createSandbox(TEAM_SEED)
  await sandbox.run('git switch -c feature')
  await sandbox.run('echo "draft" > notes.md')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m "Add notes"')
  return sandbox
}

describe('pushed and upstream-set goals', () => {
  it('counts a branch pushed without -u as pushed, but not as paired', async () => {
    const sandbox = await featureCommitted()
    await sandbox.run('git push origin feature')

    expect(await meets(sandbox, { kind: 'pushed', branch: 'feature' })).toBe(true)
    expect(await meets(sandbox, { kind: 'upstream-set', branch: 'feature' })).toBe(false)
  })

  it('sees the pairing once the branch is pushed with -u', async () => {
    const sandbox = await featureCommitted()
    await sandbox.run('git push -u origin feature')

    expect(await meets(sandbox, { kind: 'upstream-set', branch: 'feature' })).toBe(true)
  })

  it('sees the pairing a clone sets up for the branch it checks out', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    expect(await meets(sandbox, { kind: 'upstream-set', branch: 'main' })).toBe(true)
  })
})

describe('clone-exists goals', () => {
  it('recognises a clone inside the projects folder', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')
    await sandbox.run('mkdir projects')
    await sandbox.run('cd projects')
    await sandbox.run(`git clone ${REMOTE_URL} check`)

    expect(await meets(sandbox, { kind: 'clone-exists', path: 'projects/check' })).toBe(true)
    expect(await meets(sandbox, { kind: 'clone-exists', path: 'check' })).toBe(false)
  })

  it('passes for a folder cloned from the remote', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')
    await sandbox.run(`git clone ${REMOTE_URL} check`)

    expect(await meets(sandbox, { kind: 'clone-exists', path: 'check' })).toBe(true)
  })

  it('fails for a plain folder with the same name', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')
    await sandbox.run('mkdir check')

    expect(await meets(sandbox, { kind: 'clone-exists', path: 'check' })).toBe(false)
  })

  it('fails for a repository that was never cloned from the remote', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('cd ~')
    await sandbox.run('mkdir check')
    await sandbox.run('cd check')
    await sandbox.run('git init')

    expect(await meets(sandbox, { kind: 'clone-exists', path: 'check' })).toBe(false)
  })
})
