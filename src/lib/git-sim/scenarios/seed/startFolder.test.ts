import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const PROJECT_FILES: SandboxSeed['setup'] = [{ write: { 'app.txt': 'show(tasks)\n' } }]

describe('the folder the terminal starts in', () => {
  it('is the project folder when the seed names no start', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', setup: PROJECT_FILES })

    expect((await sandbox.prompt()).directory).toBe('~/todo-app')
  })

  it('is the start folder, relative to home, when the seed names one', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', start: '', setup: PROJECT_FILES })

    expect((await sandbox.prompt()).directory).toBe('~')
  })

  it('leaves goal checks looking at the project folder', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', start: '', setup: PROJECT_FILES })
    await sandbox.run('cd todo-app')
    await sandbox.run('git init')

    expect((await sandbox.snapshot()).repoLocation).toBe('project')
  })

  it('is the start folder again after starting over', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', start: '', setup: PROJECT_FILES })
    await sandbox.run('cd todo-app')
    await sandbox.reset()

    expect((await sandbox.prompt()).directory).toBe('~')
  })
})
