import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

async function conflicted(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c other')
  await sandbox.writeFile('f.txt', `${BASE}theirs\n`)
  await sandbox.run('git commit -qam theirs')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', `${BASE}ours\n`)
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge other')
  return sandbox
}

describe('git merge --quit', () => {
  it('forgets the merge and keeps files and index', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git merge --quit')).toBe('')

    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt')
    expect(await sandbox.readFile('f.txt')).toContain('<<<<<<< HEAD')
  })

  it('does nothing outside a merge', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git merge --quit')).toBe('')
  })
})
