import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

function withinSeconds<T>(work: Promise<T>, seconds: number): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`no answer within ${seconds}s`)), seconds * 1000)
    }),
  ])
}

function ignoreLessonSandbox(): Promise<Sandbox> {
  return createSandbox({
    dir: 'todo-app',
    setup: [
      { run: 'git init' },
      { write: { 'app.txt': 'show(tasks)\n', '.gitignore': '*.log\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "feat: add task list"' },
    ],
  })
}

describe('a folder named with a backslash', () => {
  it('does not hang the snapshot after a broken repository is replaced one level up', async () => {
    const sandbox = await ignoreLessonSandbox()
    for (const line of ['mkdir \\', 'echo junk > .git/HEAD', 'cd ..', 'git init']) await sandbox.run(line)

    const snapshot = await withinSeconds(sandbox.snapshot(), 3)

    expect(snapshot.workdirFiles).not.toContain('\\')
  })
})
