import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'a\nb\n', 'old.txt': 'x\ny\nz\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'a.txt': 'a\nB\nc\n', 'notes/longer-name.md': '1\n2\n3\n4\n' } },
    { run: 'git rm -q old.txt' },
    { run: 'git add .' },
    { run: 'git commit -m "Rework files"' },
  ],
}

describe('git show --stat', () => {
  it('lists changed files and counts in place of the diff', async () => {
    const sandbox = await createSandbox(SEED)
    const lines = (await textOf(sandbox, 'git show --stat')).split('\n')

    expect(lines.slice(0, 1)).toEqual([expect.stringMatching(/^commit [0-9a-f]{40} \(HEAD -> main\)$/)])
    expect(lines.slice(3)).toEqual([
      '',
      '    Rework files',
      '',
      ' a.txt                | 3 ++-',
      ' notes/longer-name.md | 4 ++++',
      ' old.txt              | 3 ---',
      ' 3 files changed, 6 insertions(+), 4 deletions(-)',
    ])
  })

  it('counts a merge commit against its first parent', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -q -c side')
    await sandbox.run('echo s > s.txt')
    await sandbox.run('git add s.txt')
    await sandbox.run('git commit -q -m "Add s"')
    await sandbox.run('git switch -q main')
    await sandbox.run('git commit -q --allow-empty -m "Main moves"')
    await sandbox.run('git merge -q --no-edit side')

    const lines = (await textOf(sandbox, 'git show --stat')).split('\n')
    expect(lines.slice(-2)).toEqual([' s.txt | 1 +', ' 1 file changed, 1 insertion(+)'])
  })

  it('works for the first commit', async () => {
    const sandbox = await createSandbox(SEED)
    const lines = (await textOf(sandbox, 'git show --stat HEAD~1')).split('\n')
    expect(lines.slice(-3)).toEqual([' a.txt   | 2 ++', ' old.txt | 3 +++', ' 2 files changed, 5 insertions(+)'])
  })
})
