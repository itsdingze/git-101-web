import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ run: 'git init' }, { write: { 'notes.txt': 'keep\n' } }],
}

describe('redirecting a command that prints nothing', () => {
  it('leaves an empty file with >', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add . > log.txt')

    expect(await sandbox.readFile('log.txt')).toBe('')
  })

  it('creates an empty file from a bare > with no command', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('> new.txt')

    expect(await sandbox.readFile('new.txt')).toBe('')
  })

  it('empties an existing file from a bare >', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('> notes.txt')

    expect(await sandbox.readFile('notes.txt')).toBe('')
  })

  it('leaves the file unchanged with >>', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add . >> notes.txt')

    expect(await sandbox.readFile('notes.txt')).toBe('keep\n')
  })
})
