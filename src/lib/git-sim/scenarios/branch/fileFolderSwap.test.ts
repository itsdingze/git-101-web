import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function swappedOnBranch(): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of [
    'git init',
    'echo a > a',
    'echo p > p',
    'git add .',
    'git commit -m c1',
    'git switch -c f',
    'git rm -q p',
    'mkdir p',
    'echo q > p/q',
    'git add .',
    'git commit -m folder',
  ]) {
    await sandbox.run(line)
  }
  return sandbox
}

describe('switching across a file replaced by a folder, matched to git 2.51', () => {
  it('puts the file back and leaves no folder behind', async () => {
    const sandbox = await swappedOnBranch()

    expect(await textOf(sandbox, 'git switch main')).toBe("Switched to branch 'main'")
    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat p')).toBe('p')
  })

  it('turns the file back into the folder on the way back', async () => {
    const sandbox = await swappedOnBranch()
    await sandbox.run('git switch main')

    expect(await textOf(sandbox, 'git switch f')).toBe("Switched to branch 'f'")
    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat p/q')).toBe('q')
  })

  it('stashes cleanly afterwards, moving the stash ref only once the stash is saved', async () => {
    const sandbox = await swappedOnBranch()
    await sandbox.run('git switch main')
    await sandbox.run('echo z > a')

    expect(await textOf(sandbox, 'git stash')).toMatch(/^Saved working directory and index state WIP on main/)
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}: WIP on main/)
    expect(await textOf(sandbox, 'git status -s')).toBe('')
  })
})
