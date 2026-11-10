import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function modified(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
      { write: { 'sub/inner/a.txt': 'a\n', 'sub/b.txt': 'b\n' } },
    ],
  })
  await sandbox.writeFile('f.txt', 'one\ntwo\n')
  return sandbox
}

describe('git status format flags', () => {
  it('lets the last format win', async () => {
    const sandbox = await modified()

    expect(await textOf(sandbox, 'git status --porcelain --long')).toContain('On branch main')
    expect(await textOf(sandbox, 'git status -s --long')).toContain('On branch main')
    expect(await textOf(sandbox, 'git status --long --porcelain')).toContain(' M f.txt')
  })

  it('refuses --long with -z', async () => {
    const sandbox = await modified()

    expect(await textOf(sandbox, 'git status --long -z')).toBe("fatal: options '--long' and '-z' cannot be used together")
  })
})
