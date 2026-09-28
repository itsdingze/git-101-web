import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, EMPTY_SEED, meets, shelvedSandbox } from '@/lib/git-sim/goals/goalFixtures'

describe('stash goals', () => {
  it('lists the entries newest first and counts them', async () => {
    const sandbox = await shelvedSandbox()

    expect((await sandbox.snapshot()).stashes).toEqual(['On main: second', 'On main: first'])
    expect(await meets(sandbox, { kind: 'stash-count', count: 2 })).toBe(true)
    expect(await meets(sandbox, { kind: 'stash-count', count: 1 })).toBe(false)
    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(false)
  })

  it('counts the stack down as entries are popped', async () => {
    const sandbox = await shelvedSandbox()

    await sandbox.run('git stash pop')
    expect(await meets(sandbox, { kind: 'stash-count', count: 1 })).toBe(true)
    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(false)

    await sandbox.run('git checkout index.html')
    await sandbox.run('git stash pop')
    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(true)
    expect(await meets(sandbox, { kind: 'stash-count', count: 1 })).toBe(false)
  })

  it('keeps the entry counted after an apply', async () => {
    const sandbox = await shelvedSandbox()
    await sandbox.run('git stash apply')

    expect(await meets(sandbox, { kind: 'stash-count', count: 2 })).toBe(true)
  })

  it('sees an empty stack after clear', async () => {
    const sandbox = await shelvedSandbox()
    await sandbox.run('git stash clear')

    expect((await sandbox.snapshot()).stashes).toEqual([])
    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(true)
  })

  it('reads an untouched repository as an empty stack', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(true)
    expect(await meets(sandbox, { kind: 'stash-count', count: 0 })).toBe(true)
  })

  it('never calls a directory outside a repository an empty stack', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await meets(sandbox, { kind: 'stash-empty' })).toBe(false)
  })
})
