import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('restoring a stashed untracked file over a new one', () => {
  it('refuses, keeps your file and the stash entry, like real git', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "stashed" > new.md')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "mine" > new.md')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('new.md already exists, no checkout')
    expect(output).toContain('error: could not restore untracked files from stash')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'cat new.md')).toBe('mine')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })
})
