import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('undoing git rm before the commit, matched to git 2.51', () => {
  it('unstages the deletion from HEAD, then restores the file from the index', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git rm -q style.css')

    expect(await textOf(sandbox, 'git restore style.css')).toBe(
      "error: pathspec 'style.css' did not match any file(s) known to git",
    )
    expect(await textOf(sandbox, 'git restore --staged style.css')).toBe('')
    expect(await textOf(sandbox, 'git status -s')).toBe(' D style.css')
    expect(await textOf(sandbox, 'git restore style.css')).toBe('')
    expect(await textOf(sandbox, 'git status -s')).toBe('')
  })
})
