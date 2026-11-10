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

describe('git restore during a conflict with a source or staged', () => {
  it('writes the source to the working tree and leaves the conflict', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git restore -s HEAD f.txt')).toBe('')

    expect(await sandbox.readFile('f.txt')).toBe(`${BASE}ours\n`)
    expect(await textOf(sandbox, 'git status --short')).toBe('UU f.txt')
  })

  it('clears the conflict with -SW', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git restore -SW f.txt')).toBe('')

    expect(await textOf(sandbox, 'git status --short')).toBe('')
    expect(await sandbox.readFile('f.txt')).toBe(`${BASE}ours\n`)
  })

  it('unstages with -S and keeps the markers', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git restore -S f.txt')).toBe('')

    expect(await textOf(sandbox, 'git status --short')).toBe(' M f.txt')
  })
})
