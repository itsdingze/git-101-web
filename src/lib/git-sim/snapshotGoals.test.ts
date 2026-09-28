import { describe, expect, it } from 'vitest'
import { createSandbox } from './createSandbox'
import type { GoalCheck } from './goals'
import { COMMITTED_SEED, EMPTY_SEED, meets, shelvedSandbox } from './goalFixtures'

describe('head-message goals', () => {
  it('matches the subject of the commit HEAD points at, ignoring case', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect((await sandbox.snapshot()).headMessage).toBe('Initial commit')
    expect(await meets(sandbox, { kind: 'head-message', includes: 'INITIAL' })).toBe(true)
    expect(await meets(sandbox, { kind: 'head-message', includes: 'polish the header' })).toBe(false)
  })

  it('follows an amended subject without counting a new commit', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git commit --amend -m "Add the landing page"')

    expect(await meets(sandbox, { kind: 'head-message', includes: 'landing page' })).toBe(true)
    expect(await meets(sandbox, { kind: 'head-message', includes: 'Initial commit' })).toBe(false)
    expect(await meets(sandbox, { kind: 'commit-count', count: 1 })).toBe(true)
  })

  it('fails before the first commit exists', async () => {
    const sandbox = await createSandbox({ dir: 'my-project', setup: [{ run: 'git init' }] })

    expect((await sandbox.snapshot()).headMessage).toBeNull()
    expect(await meets(sandbox, { kind: 'head-message', includes: 'anything' })).toBe(false)
  })
})

describe('commit-count goals', () => {
  it('grows with every commit, including a revert', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    expect(await meets(sandbox, { kind: 'commit-count', count: 1 })).toBe(true)
    expect(await meets(sandbox, { kind: 'commit-count', count: 2 })).toBe(false)

    await sandbox.run('echo "console.log(1)" > app.js')
    await sandbox.run('git add app.js')
    await sandbox.run('git commit -m "Add the script"')
    expect(await meets(sandbox, { kind: 'commit-count', count: 2 })).toBe(true)

    await sandbox.run('git revert HEAD --no-edit')
    expect(await meets(sandbox, { kind: 'commit-count', count: 3 })).toBe(true)
  })
})

describe('any-of goals', () => {
  it('accepts either route to the same result', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git switch -c feature')

    const eitherWay: GoalCheck = {
      kind: 'any-of',
      checks: [
        { kind: 'on-branch', name: 'feature' },
        { kind: 'all-of', checks: [{ kind: 'on-branch', name: 'main' }, { kind: 'commit-count', count: 1 }] },
      ],
    }

    expect(await meets(sandbox, eitherWay)).toBe(true)

    await sandbox.run('git switch main')
    expect(await meets(sandbox, eitherWay)).toBe(true)
  })

  it('fails when no branch of the choice holds', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(
      await meets(sandbox, {
        kind: 'any-of',
        checks: [
          { kind: 'branch-exists', name: 'feature' },
          { kind: 'branch-exists', name: 'hotfix' },
        ],
      }),
    ).toBe(false)
  })

  it('nests inside all-of', async () => {
    const sandbox = await shelvedSandbox()

    const check: GoalCheck = {
      kind: 'all-of',
      checks: [
        { kind: 'commit-count', count: 1 },
        { kind: 'any-of', checks: [{ kind: 'stash-count', count: 2 }, { kind: 'stash-empty' }] },
      ],
    }

    expect(await meets(sandbox, check)).toBe(true)

    await sandbox.run('git stash drop')
    expect(await meets(sandbox, check)).toBe(false)
  })
})

describe('snapshot resilience', () => {
  it('reads a directory that was never a repository', async () => {
    const snapshot = await (await createSandbox(EMPTY_SEED)).snapshot()

    expect(snapshot.isRepo).toBe(false)
    expect(snapshot.stashes).toEqual([])
    expect(snapshot.headMessage).toBeNull()
    expect(snapshot.ignored).toEqual([])
    expect(snapshot.tracked).toEqual([])
  })

  it('survives the .git directory being deleted mid-lesson', async () => {
    const sandbox = await shelvedSandbox()
    await sandbox.run('rm -rf .git')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.isRepo).toBe(false)
    expect(snapshot.stashes).toEqual([])
    expect(snapshot.headMessage).toBeNull()
    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(false)
  })
})

describe('merge-in-progress goals', () => {
  const CONFLICT_SEED = {
    dir: 'my-project',
    setup: [
      { run: 'git init' },
      { write: { 'hours.txt': 'Open every day.\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
      { run: 'git switch -c opening-hours' },
      { write: { 'hours.txt': 'Open 7am to 6pm.\n' } },
      { run: 'git commit -am "Spell out the hours"' },
      { run: 'git switch main' },
      { write: { 'hours.txt': 'Open daily.\n' } },
      { run: 'git commit -am "Shorten the hours"' },
    ],
  }

  it('holds while a merge is paused on a conflict and clears once it is committed', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    expect(await meets(sandbox, { kind: 'merge-in-progress' })).toBe(false)

    await sandbox.run('git merge opening-hours')
    expect(await meets(sandbox, { kind: 'merge-in-progress' })).toBe(true)

    await sandbox.run('echo "Open daily, 7am to 6pm." > hours.txt')
    await sandbox.run('git add hours.txt')
    await sandbox.run('git commit -m "Merge opening-hours"')
    expect(await meets(sandbox, { kind: 'merge-in-progress' })).toBe(false)
  })

  it('is not fooled by the files a merge would bring in', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('touch directions.html')

    expect(await meets(sandbox, { kind: 'merge-in-progress' })).toBe(false)
  })
})
