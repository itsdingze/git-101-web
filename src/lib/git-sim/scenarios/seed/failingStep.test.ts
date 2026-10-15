import { describe, expect, it } from 'vitest'
import { createSandbox, type SeedStep } from '@/lib/git-sim/createSandbox'

const DIVERGED: readonly SeedStep[] = [
  { run: 'git init' },
  { write: { 'settings.txt': 'MAX_TASKS = 25\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "feat: add settings"' },
  { run: 'git switch -c raise-limit' },
  { write: { 'settings.txt': 'MAX_TASKS = 50\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "feat: try a limit of 50"' },
  { run: 'git switch main' },
  { write: { 'settings.txt': 'MAX_TASKS = 30\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "feat: raise the task limit to 30"' },
]

describe('a seed step that ends in an error', () => {
  it('stops the seed, naming the step', async () => {
    const seeding = createSandbox({ dir: 'todo-app', setup: [...DIVERGED, { run: 'git merge raise-limit' }] })

    await expect(seeding).rejects.toThrow('Sandbox seed step failed: git merge raise-limit')
  })

  it('carries on when the step is marked allowFailure, like a merge that stops on a conflict', async () => {
    const sandbox = await createSandbox({
      dir: 'todo-app',
      setup: [
        ...DIVERGED,
        { run: 'git merge raise-limit', allowFailure: true },
        { write: { 'settings.txt': 'MAX_TASKS = 50\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Merge raise-limit"' },
      ],
    })

    const snapshot = await sandbox.snapshot()
    expect(snapshot.mergeInProgress).toBe(false)
    expect(snapshot.commits.some((commit) => commit.parents.length === 2)).toBe(true)
  })
})
