import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\n'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function stagedAndUnstaged(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('f.txt', `${BASE}staged\n`)
  await sandbox.run('git add f.txt')
  await sandbox.writeFile('f.txt', `${BASE}staged\nunstaged\n`)
  return sandbox
}

describe('git restore -S', () => {
  it('unstages and keeps the working tree', async () => {
    const sandbox = await stagedAndUnstaged()

    await sandbox.run('git restore -S f.txt')

    expect(await textOf(sandbox, 'git status --short')).toBe(' M f.txt')
    expect(await sandbox.readFile('f.txt')).toBe(`${BASE}staged\nunstaged\n`)
  })

  it('also resets the working tree with -W', async () => {
    const sandbox = await stagedAndUnstaged()

    await sandbox.run('git restore -S -W f.txt')

    expect(await textOf(sandbox, 'git status --short')).toBe('')
    expect(await sandbox.readFile('f.txt')).toBe(BASE)
  })

  it('reads the index from a named source and leaves the file alone', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('f.txt', `${BASE}second\n`)
    await sandbox.run('git commit -am second')
    await sandbox.writeFile('f.txt', `${BASE}second\nthird\n`)
    await sandbox.run('git add f.txt')

    await sandbox.run('git restore -s HEAD~1 -S f.txt')

    expect(await textOf(sandbox, 'git status --short')).toBe('MM f.txt')
    expect(await sandbox.readFile('f.txt')).toBe(`${BASE}second\nthird\n`)
  })
})
