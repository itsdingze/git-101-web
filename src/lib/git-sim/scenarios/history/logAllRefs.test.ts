import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'

async function shapeOf(sandbox: Sandbox, line: string): Promise<string[]> {
  const result = await sandbox.run(line)
  return result.outputs
    .map((output) => output.text)
    .join('\n')
    .split('\n')
    .map((row) => row.replace(/[0-9a-f]{7}/g, 'x'))
}

describe('ref names in log decorations', () => {
  it('come in the order real git prints them: HEAD first, then the other names from z to a', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git branch b6')
    await sandbox.run('git branch zed')
    await sandbox.run('git branch aa')

    expect(await shapeOf(sandbox, 'git log --oneline -n 1')).toEqual(['x (HEAD -> main, zed, b6, aa) Initial commit'])
  })
})

describe('git log --all', () => {
  it('includes the stash, labelled refs/stash, like real git', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "changed" > index.html')
    await sandbox.run('git stash')

    expect(await shapeOf(sandbox, 'git log --oneline --graph --all')).toEqual([
      '*   x (refs/stash) WIP on main: x Initial commit',
      '|\\',
      '| * x index on main: x Initial commit',
      '|/',
      '* x (HEAD -> main) Initial commit',
    ])
  })
})
