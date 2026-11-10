import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

async function diverged(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
    ],
  })
  await sandbox.writeFile('f.txt', `${BASE}x\n`)
  await sandbox.run('git commit -qam two')
  await sandbox.run('git switch -q -c s')
  await sandbox.writeFile('f.txt', `${BASE}x\ny\n`)
  await sandbox.run('git commit -qam s')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('g.txt', 'alpha\nz\n')
  await sandbox.run('git commit -qam m')
  return sandbox
}

function subjects(text: string): string[] {
  return text.split('\n').sort()
}

describe('revisions git log and friends read', () => {
  it.each(['s...main', 'main...s', '...s', 's...'])('reads %s as the symmetric difference', async (range) => {
    const sandbox = await diverged()

    expect(subjects(await textOf(sandbox, `git log --format=%s ${range}`))).toEqual(['m', 's'])
  })

  it('reads @ as HEAD', async () => {
    const sandbox = await diverged()

    expect(await textOf(sandbox, 'git log --format=%s -1 @')).toBe('m')
    expect(await textOf(sandbox, 'git log --format=%s -1 @~1')).toBe('two')
    expect(await textOf(sandbox, 'git show -s --format=%s @')).toBe('m')
    expect(await textOf(sandbox, 'git diff --stat @')).toBe('')
  })
})
