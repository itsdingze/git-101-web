import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { GIT_COMMANDS } from '@/lib/git-sim/commands/git/registry'

const COURSE_COMMANDS = [
  'init', 'config', 'status', 'add', 'commit', 'rm', 'switch', 'branch', 'merge', 'log',
  'restore', 'show', 'diff', 'remote', 'push', 'clone', 'pull', 'stash',
]

describe('the git commands the simulator runs', () => {
  it('are exactly the ones the course teaches', () => {
    expect(Object.keys(GIT_COMMANDS).sort()).toEqual([...COURSE_COMMANDS].sort())
  })

  it('points git checkout to switch and restore', async () => {
    const sandbox = await createSandbox({ dir: 'todo-app', setup: [{ run: 'git init' }] })

    const result = await sandbox.run('git checkout main')

    expect(result.outputs).toEqual([
      {
        stream: 'stderr',
        text: "git checkout is a real Git command, but this practice sandbox doesn't simulate it. Use git switch <branch> to change branches, or git restore <file> to discard edits.",
        prose: true,
      },
    ])
  })

  it.each(['fetch', 'reflog', 'reset', 'revert'])(
    'call git %s a real command this sandbox does not simulate',
    async (name) => {
      const sandbox = await createSandbox({ dir: 'todo-app', setup: [{ run: 'git init' }] })

      const result = await sandbox.run(`git ${name}`)

      expect(result.outputs).toEqual([
        { stream: 'stderr', text: `git ${name} is a real Git command, but this practice sandbox doesn't simulate it.`, prose: true },
      ])
    },
  )
})
