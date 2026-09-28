import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { meets } from '@/lib/git-sim/goals/goalFixtures'

const CONFLICT_SEED: SandboxSeed = {
  dir: 'bakery',
  setup: [
    { run: 'git init' },
    { write: { 'hours.txt': 'Open 9 to 5.\n', 'menu.txt': 'Bread\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c opening-hours' },
    { write: { 'hours.txt': 'Open 7am to 6pm, every day.\n' } },
    { run: 'git commit -am "Spell out the hours"' },
    { run: 'git switch main' },
    { write: { 'hours.txt': 'Open daily.\n' } },
    { run: 'git commit -am "Shorten the hours"' },
  ],
}

describe('no-conflict-markers goals', () => {
  it('fail while a file still holds conflict markers and pass once they are gone', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    expect(await meets(sandbox, { kind: 'no-conflict-markers' })).toBe(true)

    await sandbox.run('git merge opening-hours')
    expect(await meets(sandbox, { kind: 'no-conflict-markers' })).toBe(false)

    await sandbox.run('echo "Open daily, 7am to 6pm." > hours.txt')
    expect(await meets(sandbox, { kind: 'no-conflict-markers' })).toBe(true)
  })

  it('ignore marker-like text that is not a whole marker line', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('echo "a <<<<<<< b ======= c" > notes.txt')
    await sandbox.run('echo "==========" > rule.txt')

    expect(await meets(sandbox, { kind: 'no-conflict-markers' })).toBe(true)
  })
})

describe('markers-committed goals', () => {
  it('pass only once a commit has recorded a file with markers in it', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('git merge opening-hours')
    expect(await meets(sandbox, { kind: 'markers-committed' })).toBe(false)

    await sandbox.run('git add hours.txt')
    await sandbox.run('git commit -m "Merge opening-hours"')
    expect(await meets(sandbox, { kind: 'markers-committed' })).toBe(true)
  })

  it('stay false after a clean resolution is committed', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('git merge opening-hours')
    await sandbox.run('echo "Open daily." > hours.txt')
    await sandbox.run('git add hours.txt')
    await sandbox.run('git commit -m "Merge opening-hours"')

    expect(await meets(sandbox, { kind: 'markers-committed' })).toBe(false)
  })
})
