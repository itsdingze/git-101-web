import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function stagedThenReverted(): Promise<Sandbox> {
  const sandbox = await createSandbox(COMMITTED_SEED)
  await sandbox.run('echo "changed" > index.html')
  await sandbox.run('git add index.html')
  await sandbox.run('echo "<h1>My project</h1>" > index.html')
  return sandbox
}

describe('a staged edit whose file was changed back', () => {
  it('shows as staged and unstaged, like real git', async () => {
    const sandbox = await stagedThenReverted()

    expect(await textOf(sandbox, 'git status -s')).toBe('MM index.html')
  })

  it('leaves nothing to commit with commit -am, because the file matches the last commit', async () => {
    const sandbox = await stagedThenReverted()

    expect(await textOf(sandbox, 'git commit -am two')).toBe('On branch main\nnothing to commit, working tree clean')
    expect((await sandbox.snapshot()).commits).toHaveLength(1)
  })
})
