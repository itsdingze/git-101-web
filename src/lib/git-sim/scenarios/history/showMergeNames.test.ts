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
    { write: { 'f.txt': `${BASE}x\n` } },
    { run: 'git commit -q -am second' },
  ],
}

async function cleanMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c o')
  await sandbox.writeFile('o.txt', 'o\n')
  await sandbox.run('git add .')
  await sandbox.run('git commit -qm o')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('m.txt', 'm\n')
  await sandbox.run('git add .')
  await sandbox.run('git commit -qm m')
  await sandbox.run('git merge -q --no-edit o')
  return sandbox
}

async function resolvedMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c o')
  await sandbox.writeFile('f.txt', `${BASE}x\nt\n`)
  await sandbox.run('git commit -qam o')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', `${BASE}x\nm\n`)
  await sandbox.run('git commit -qam m')
  await sandbox.run('git merge o')
  await sandbox.writeFile('f.txt', `${BASE}x\nboth\n`)
  await sandbox.run('git add .')
  await sandbox.run('git commit -qm merged')
  return sandbox
}

describe('git show --name-only on a merge', () => {
  it('lists nothing for a clean merge', async () => {
    const sandbox = await cleanMerge()

    expect(await textOf(sandbox, 'git show --format=%s --name-only')).toBe("Merge branch 'o'")
  })

  it('lists paths that differ from both parents', async () => {
    const sandbox = await resolvedMerge()

    expect(await textOf(sandbox, 'git show --format=%s --name-only')).toBe('merged\n\nf.txt')
  })
})
