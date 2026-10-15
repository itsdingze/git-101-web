import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const CONFLICT_SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [
    { run: 'git init' },
    { write: { 'app.txt': 'tasks = load("tasks.txt")\n\nshow(tasks)\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "feat: add task list"' },
    { run: 'git switch -c add-reminders' },
    { write: { 'app.txt': 'tasks = load("tasks.txt")\n\nshow(tasks, reminders)\n' } },
    { run: 'git commit -am "feat: add reminders"' },
    { run: 'git switch main' },
    { write: { 'app.txt': 'tasks = load("tasks.txt")\n\nshow(open_tasks)\n' } },
    { run: 'git commit -am "fix: hide finished tasks"' },
    { run: 'git switch add-reminders' },
    { run: 'git merge main', allowFailure: true },
  ],
}

describe('saving a file from the editor panel', () => {
  it('reads the conflicted file exactly, blank lines and markers included', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)

    const text = await sandbox.readFile('app.txt')

    expect(text).toContain('tasks = load("tasks.txt")\n\n<<<<<<< HEAD\nshow(tasks, reminders)\n=======\nshow(open_tasks)\n>>>>>>> main\n')
  })

  it('writes the resolution so the learner can stage and commit it, without counting as a command', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)

    await sandbox.writeFile('app.txt', 'tasks = load("tasks.txt")\n\nshow(open_tasks, reminders)\n')
    const saved = await sandbox.snapshot()
    await sandbox.run('git add app.txt')
    const commit = await sandbox.run('git commit --no-edit')
    const merged = await sandbox.snapshot()

    expect(saved.conflictMarkerFiles).toEqual([])
    expect(saved.lastCommand).toBeNull()
    expect(commit.outputs.some((output) => output.stream === 'stderr')).toBe(false)
    expect(merged.mergeInProgress).toBe(false)
    expect(await sandbox.readFile('app.txt')).toBe('tasks = load("tasks.txt")\n\nshow(open_tasks, reminders)\n')
  })
})
