import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { openExportPullRequest } from '@/lib/git-sim/scenarios/gh/pullRequestFixtures'
import type { CommandOutput } from '@/lib/git-sim/types'

async function repository(): Promise<Sandbox> {
  return createSandbox(
    { dir: 'todo-app', setup: [{ run: 'git init' }, { write: { 'app.txt': 'show(tasks)\n' } }, { run: 'git add .' }] },
    new Map([['stash', 'Lesson 11']]),
  )
}

function proseOnly(outputs: readonly CommandOutput[]): boolean {
  return outputs.length > 0 && outputs.every((output) => output.prose === true)
}

describe('lines the course writes itself', () => {
  it.each(['help', 'git stash', 'git checkout main', 'git commit', 'git status \\', 'gh auth login'])(
    'are marked as prose for %s',
    async (line) => {
      const sandbox = await repository()

      expect(proseOnly((await sandbox.run(line)).outputs)).toBe(true)
    },
  )

  it('are marked as prose when gh only simulates --merge', async () => {
    const sandbox = await openExportPullRequest()

    expect(proseOnly((await sandbox.run('gh pr merge --squash')).outputs)).toBe(true)
  })
})

describe("Git's own output", () => {
  it.each(['git status', 'git log --oneline', 'ls', 'git switch nowhere'])('is not marked as prose for %s', async (line) => {
    const sandbox = await repository()
    await sandbox.run('git commit -m "feat: add task list"')

    expect((await sandbox.run(line)).outputs.some((output) => output.prose)).toBe(false)
  })
})
