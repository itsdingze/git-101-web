import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/scenarios/goalFixtures'

describe('snapshots describe the project folder wherever the learner stands', () => {
  it('lists the project files from inside a subfolder of a folder with no repository', async () => {
    const sandbox = await createSandbox({ dir: 'cookbook', setup: [{ write: { 'ragu.md': 'r\n', 'desserts/tiramisu.md': 't\n' } }] })
    await sandbox.run('cd desserts')

    expect((await sandbox.snapshot()).workdirFiles).toEqual(['desserts', 'ragu.md'])
  })

  it('can check a file inside a subfolder by its path from the project root', async () => {
    const sandbox = await createSandbox({ dir: 'cookbook', setup: [{ write: { 'desserts/tiramisu.md': 't\n' } }] })
    await sandbox.run('cd desserts')
    await sandbox.run('echo "note" > todo.txt')

    expect(await meets(sandbox, { kind: 'file-present', path: 'desserts/todo.txt' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-present', path: 'todo.txt' })).toBe(false)
  })

  it('can check a top-level dotfile and a dot folder by name', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    const envPresent = { kind: 'file-present', path: '.env' } as const
    const envAbsent = { kind: 'file-absent', path: '.env' } as const

    expect(await meets(sandbox, envPresent)).toBe(false)
    expect(await meets(sandbox, envAbsent)).toBe(true)

    await sandbox.run('echo SECRET=1 > .env')
    await sandbox.run('mkdir .config')
    await sandbox.run('echo x > .config/app')

    expect(await meets(sandbox, envPresent)).toBe(true)
    expect(await meets(sandbox, envAbsent)).toBe(false)
    expect(await meets(sandbox, { kind: 'file-present', path: '.config' })).toBe(true)
    expect((await sandbox.snapshot()).workdirFiles).toEqual(['index.html', 'style.css'])
  })

  it('still reads the repository after the learner climbs out of it', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('cd ~')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.isRepo).toBe(true)
    expect(snapshot.headMessage).toBe('Initial commit')
  })
})
