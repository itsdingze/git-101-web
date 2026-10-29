import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const CLONED: SandboxSeed = {
  dir: 'work',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/work.git',
    setup: [
      { write: { a: 'a\n' } },
      { run: 'git add a' },
      { run: 'git commit -m c1' },
      { run: 'git switch -c experiment' },
      { run: 'git commit --allow-empty -m e1' },
      { run: 'git switch main' },
    ],
  },
}

async function listing(sandbox: Sandbox, line: string): Promise<string> {
  return (await textOf(sandbox, line)).replace(/ [0-9a-f]{7} /g, ' HASH ')
}

describe('git branch -r', () => {
  it('lists only remote-tracking branches', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await textOf(sandbox, 'git branch -r')).toBe('  origin/experiment\n  origin/main')
    expect(await textOf(sandbox, 'git branch --remotes')).toBe('  origin/experiment\n  origin/main')
  })

  it('prints nothing at all when there are no remotes', async () => {
    const sandbox = await createSandbox({ dir: 'solo', setup: [{ run: 'git init' }, { run: 'git commit -q --allow-empty -m c1' }] })
    expect((await sandbox.run('git branch -r')).outputs).toEqual([])
  })
})

describe('git branch -vv', () => {
  it('shows each branch with its commit and upstream', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await listing(sandbox, 'git branch -vv')).toBe('* main HASH [origin/main] c1')
  })

  it('lines up names and counts commits ahead', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('git commit --allow-empty -m c2')
    await sandbox.run('git branch topic')
    expect(await listing(sandbox, 'git branch -vv')).toBe(
      ['* main  HASH [origin/main: ahead 1] c2', '  topic HASH c2'].join('\n'),
    )
  })

  it('counts both sides when the branches have diverged', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('echo b > b')
    await sandbox.run('git add b')
    await sandbox.run('git commit -m c2')
    await sandbox.run('git push')
    await sandbox.run('git commit --amend -m c2b')
    expect(await listing(sandbox, 'git branch -vv')).toBe('* main HASH [origin/main: ahead 1, behind 1] c2b')
    expect(await listing(sandbox, 'git branch -v')).toBe('* main HASH [ahead 1, behind 1] c2b')
  })

  it('leaves the upstream out of -v when nothing differs', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await listing(sandbox, 'git branch -v')).toBe('* main HASH c1')
  })

  it('pads remote-tracking rows with the local ones', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await listing(sandbox, 'git branch -vv -a')).toBe(
      [
        '* main                      HASH [origin/main] c1',
        '  remotes/origin/experiment HASH e1',
        '  remotes/origin/main       HASH c1',
      ].join('\n'),
    )
    expect(await listing(sandbox, 'git branch -vv -r')).toBe(
      ['  origin/experiment HASH e1', '  origin/main       HASH c1'].join('\n'),
    )
  })

  it('reads -v inside combined short flags', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await listing(sandbox, 'git branch -rv')).toBe(
      ['  origin/experiment HASH e1', '  origin/main       HASH c1'].join('\n'),
    )
  })
})
