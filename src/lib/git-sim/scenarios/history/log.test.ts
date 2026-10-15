import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add alpha"' },
    { write: { 'b.txt': 'beta\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add beta"' },
    { write: { 'c.txt': 'gamma\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add gamma"' },
  ],
}

async function shortHashes(sandbox: Sandbox): Promise<string[]> {
  const lines = (await textOf(sandbox, 'git log --oneline')).split('\n')
  return lines.map((line) => line.split(' ')[0] ?? '')
}

describe('git log against a revision', () => {
  it('accepts the abbreviated hash git log --oneline just printed', async () => {
    const sandbox = await createSandbox(SEED)
    const [, middle] = await shortHashes(sandbox)

    expect((await textOf(sandbox, `git log --oneline ${middle}`)).split('\n')).toEqual([
      `${middle} Add beta`,
      expect.stringContaining('Add alpha'),
    ])
  })

  it('accepts a branch name and a parent suffix', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --oneline main~2')).toMatch(/^[0-9a-f]{7} Add alpha$/)
  })
})

describe('git log flags that take a separate value', () => {
  it('limits the history with -n 1 and --max-count 1', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --oneline -n 1')).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main\) Add gamma$/,
    )
    expect((await textOf(sandbox, 'git log --oneline --max-count 2')).split('\n')).toHaveLength(2)
  })

  it('filters by message and author without an equals sign', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --oneline --grep beta')).toMatch(
      /^[0-9a-f]{7} Add beta$/,
    )
    expect((await textOf(sandbox, 'git log --oneline --author "Your"')).split('\n')).toHaveLength(3)
  })
})

describe('a commit message given as several -m flags', () => {
  it('keeps each -m as its own paragraph', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "delta" > d.txt')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add delta" -m "The fourth letter, for completeness."')

    expect(await textOf(sandbox, 'git log -n 1')).toMatch(
      /\n\n {4}Add delta\n {4}\n {4}The fourth letter, for completeness\.$/,
    )
    expect(await textOf(sandbox, 'git log --oneline -n 1')).toMatch(/^[0-9a-f]{7} .*Add delta$/)
  })

  it('keeps each -m as its own paragraph when amending', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git commit --amend -m "Add gamma" -m "Third of three."')

    expect(await textOf(sandbox, 'git log -n 1')).toMatch(/\n {4}Add gamma\n {4}\n {4}Third of three\.$/)
  })
})
