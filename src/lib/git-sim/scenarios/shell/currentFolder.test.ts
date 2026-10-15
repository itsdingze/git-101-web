import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [{ write: { 'app.txt': 'tasks = load()\n', 'notes/ideas.txt': 'due dates\n' } }],
}

describe('the current folder', () => {
  it('lists every file below it, relative to it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await sandbox.currentFolder()).toEqual({ files: ['app.txt', 'notes/ideas.txt'], repositories: [] })
  })

  it('follows the learner into another folder', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cd ~')

    expect((await sandbox.currentFolder()).files).toEqual(['todo-app/app.txt', 'todo-app/notes/ideas.txt'])
  })

  it('names the repositories below it, leaving out their .git folders', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git init')
    await sandbox.run('cd ~')

    expect(await sandbox.currentFolder()).toEqual({
      files: ['todo-app/app.txt', 'todo-app/notes/ideas.txt'],
      repositories: ['todo-app'],
    })
  })
})
