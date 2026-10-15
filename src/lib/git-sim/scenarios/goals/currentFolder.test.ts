import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal, type GoalCheck } from '@/lib/git-sim/goals/goalChecks'

async function homeSandbox(): Promise<Sandbox> {
  return createSandbox({
    dir: '',
    setup: [{ write: { 'documents/letter.txt': 'Dear Sam\n', 'projects/recipes/soup.txt': 'Soup\n' } }],
  })
}

async function meets(sandbox: Sandbox, check: GoalCheck): Promise<boolean> {
  return evaluateGoal(check, await sandbox.snapshot())
}

describe('the current-folder goal', () => {
  it('is met for "" while the terminal is in the home folder', async () => {
    const sandbox = await homeSandbox()

    expect(await meets(sandbox, { kind: 'current-folder', path: '' })).toBe(true)
    expect(await meets(sandbox, { kind: 'current-folder', path: 'projects' })).toBe(false)
  })

  it('is met once the learner moves into the folder', async () => {
    const sandbox = await homeSandbox()
    await sandbox.run('cd projects/recipes')

    expect(await meets(sandbox, { kind: 'current-folder', path: 'projects/recipes' })).toBe(true)
    expect(await meets(sandbox, { kind: 'current-folder', path: 'projects' })).toBe(false)
    expect(await meets(sandbox, { kind: 'current-folder', path: '' })).toBe(false)
  })

  it('follows the learner back out with cd ..', async () => {
    const sandbox = await homeSandbox()
    await sandbox.run('cd projects/recipes')
    await sandbox.run('cd ..')

    expect(await meets(sandbox, { kind: 'current-folder', path: 'projects' })).toBe(true)
  })

  it('looks at where the terminal is, not the project folder', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', start: '', setup: [{ write: { 'app.txt': 'show(tasks)\n' } }] })

    expect(await meets(sandbox, { kind: 'current-folder', path: 'todo-app' })).toBe(false)
    await sandbox.run('cd todo-app')
    expect(await meets(sandbox, { kind: 'current-folder', path: 'todo-app' })).toBe(true)
  })
})
