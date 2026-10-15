import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  remote: {
    name: 'origin',
    url: 'https://github.com/your-username/todo-app.git',
    setup: [
      { write: { 'app.txt': 'show(tasks)\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "feat: add task list"' },
    ],
    ahead: [
      { write: { 'app.txt': 'show(open_tasks)\n' } },
      { run: 'git commit -am "fix: show only open tasks"' },
    ],
  },
  setup: [{ run: 'git switch -c add-reminders' }],
}

describe("new work on GitHub's main", () => {
  it('is reported while the current branch lacks it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await sandbox.newOnGitHub('main')).toBe(true)
  })

  it('is no longer reported once the branch has pulled it in', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git pull --no-rebase origin main')

    expect(await sandbox.newOnGitHub('main')).toBe(false)
  })

  it('is not reported when GitHub has nothing the branch lacks', async () => {
    const sandbox = await createSandbox({ ...SEED, remote: { ...SEED.remote!, ahead: [] } })

    expect(await sandbox.newOnGitHub('main')).toBe(false)
  })

  it('is not reported without a remote', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', setup: [{ run: 'git init' }] })

    expect(await sandbox.newOnGitHub('main')).toBe(false)
  })
})
