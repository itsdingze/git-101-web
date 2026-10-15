import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.md': 'a\n', 'b.md': 'b\n', 'c.md': 'c\n', 'docs/d.md': 'd\n', 'e.md': 'e\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function busyProject(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  for (const line of [
    'echo "a2" > a.md',
    'git add a.md',
    'echo "a3" > a.md',
    'echo "b2" > b.md',
    'git rm c.md',
    'rm e.md',
    'echo "n" > new.md',
    'git add new.md',
    'mkdir notes',
    'echo "x" > notes/x.md',
    'echo "u" > untracked.md',
  ]) {
    await sandbox.run(line)
  }
  return sandbox
}

const SHORT_FROM_ROOT = ['MM a.md', ' M b.md', 'D  c.md', ' D e.md', 'A  new.md', '?? notes/', '?? untracked.md']

describe('git status --short', () => {
  it('prints two status letters and the path for every change, untracked last', async () => {
    const sandbox = await busyProject()

    expect(await textOf(sandbox, 'git status -s')).toBe(SHORT_FROM_ROOT.join('\n'))
    expect(await textOf(sandbox, 'git status --short')).toBe(SHORT_FROM_ROOT.join('\n'))
  })

  it('shows paths relative to the folder you are standing in', async () => {
    const sandbox = await busyProject()
    await sandbox.run('cd docs')

    expect(await textOf(sandbox, 'git status -s')).toBe(
      ['MM ../a.md', ' M ../b.md', 'D  ../c.md', ' D ../e.md', 'A  ../new.md', '?? ../notes/', '?? ../untracked.md'].join('\n'),
    )
  })

  it('prints nothing for a clean project', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git status -s')).toBe('')
  })

  it('marks unmerged files by kind', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 's.md': 'one\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { run: 'git switch -c feature' },
        { write: { 's.md': 'feature\n' } },
        { run: 'git commit -am "Feature"' },
        { run: 'git switch main' },
        { write: { 's.md': 'main\n' } },
        { run: 'git commit -am "Main"' },
      ],
    })
    await sandbox.run('git merge feature')

    expect(await textOf(sandbox, 'git status -s')).toBe('UU s.md')
  })
})
