import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/goals/goalFixtures'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

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

  it('refuses git reset on the deleted name without --, like git', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git rm -q style.css')

    expect(await textOf(sandbox, 'git reset -q style.css')).toMatch(
      /^fatal: ambiguous argument 'style.css': unknown revision or path not in the working tree\./,
    )
    expect(await textOf(sandbox, 'git status -s')).toBe('D  style.css')
  })
})
