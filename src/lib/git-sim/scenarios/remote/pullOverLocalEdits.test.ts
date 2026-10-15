import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const README = '# To-do app\nA small to-do list app for learning Git.\n'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  remote: {
    name: 'origin',
    url: 'https://github.com/your-username/todo-app.git',
    setup: [{ write: { 'README.md': README } }, { run: 'git add .' }, { run: 'git commit -m "docs: add a README"' }],
    ahead: [
      { write: { 'README.md': `${README}Run it with: start app.txt\n` } },
      { run: 'git commit -am "docs: credit Sam in the README"' },
    ],
  },
  setup: [{ write: { 'README.md': '# To-do app, with due dates\nA small to-do list app for learning Git.\n' } }],
}

const REFUSAL = [
  'error: Your local changes to the following files would be overwritten by merge:',
  '\tREADME.md',
  'Please commit your changes or stash them before you merge.',
  'Aborting',
].join('\n')

describe('git pull over uncommitted edits to a file the incoming commit changes', () => {
  it("refuses with Git's message and leaves the branch and the edits alone", async () => {
    const sandbox = await createSandbox(SEED)
    const before = await sandbox.snapshot()

    const result = await sandbox.run('git pull')

    expect(result.outputs.map((output) => output.text).join('\n')).toMatch(new RegExp(`\\nUpdating [0-9a-f]{7}\\.\\.[0-9a-f]{7}\\n${REFUSAL}$`))
    const after = await sandbox.snapshot()
    expect(after.commits.map((commit) => commit.oid)).toEqual(before.commits.map((commit) => commit.oid))
    expect(after.unstaged).toEqual([{ path: 'README.md', kind: 'modified' }])
    expect(await textOf(sandbox, 'cat README.md')).toBe('# To-do app, with due dates\nA small to-do list app for learning Git.')
  })

  it('pulls cleanly after git stash, and git stash pop brings the edits back on top', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git stash')).toMatch(/^Saved working directory and index state WIP on main: /)
    expect(await textOf(sandbox, 'git pull')).toContain('Fast-forward')
    expect(await textOf(sandbox, 'git stash pop')).toContain('Dropped refs/stash@{0}')

    expect(await textOf(sandbox, 'cat README.md')).toBe(
      '# To-do app, with due dates\nA small to-do list app for learning Git.\nRun it with: start app.txt',
    )
    const snapshot = await sandbox.snapshot()
    expect(evaluateGoal({ kind: 'stash-empty' }, snapshot)).toBe(true)
    expect(evaluateGoal({ kind: 'up-to-date-with-remote', branch: 'main' }, snapshot)).toBe(true)
    expect(snapshot.unstaged).toEqual([{ path: 'README.md', kind: 'modified' }])
  })
})
