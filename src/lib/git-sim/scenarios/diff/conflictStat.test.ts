import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': `${BASE}x\n` } },
    { run: 'git commit -q -am second' },
  ],
}

async function conflicted(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c o')
  await sandbox.writeFile('f.txt', `${BASE}x\ntheirs\n`)
  await sandbox.run('git commit -qam o')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', `${BASE}x\nours\n`)
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge o')
  return sandbox
}

describe('git diff stat during a conflict', () => {
  it('shows the unmerged row and the working diff', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git diff --stat')).toBe([' f.txt | Unmerged', ' f.txt | 4 ++++', ' 1 file changed, 4 insertions(+)'].join('\n'))
  })

  it('shows only the unmerged row for staged', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git diff --staged --stat')).toBe([' f.txt | Unmerged', ' 0 files changed'].join('\n'))
  })

  it('names the path twice with --name-only', async () => {
    const sandbox = await conflicted()

    expect(await textOf(sandbox, 'git diff --name-only')).toBe('f.txt\nf.txt')
    expect(await textOf(sandbox, 'git diff --staged --name-only')).toBe('f.txt')
  })
})
