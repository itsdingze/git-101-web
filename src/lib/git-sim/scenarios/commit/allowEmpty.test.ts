import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const COMMITTED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

describe('git commit --allow-empty', () => {
  it('records a commit with no changes', async () => {
    const sandbox = await createSandbox(COMMITTED)
    expect(await textOf(sandbox, 'git commit --allow-empty -m a')).toMatch(/^\[main [0-9a-f]{7}\] a$/)
    expect((await sandbox.snapshot()).commits.map((commit) => commit.message)).toEqual(['a', 'Initial commit'])
  })

  it('starts history in an empty repository', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })
    expect(await textOf(sandbox, 'git commit --allow-empty -m first')).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] first$/)
  })
})
