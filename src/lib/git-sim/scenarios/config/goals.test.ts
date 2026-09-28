import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/goals/goalFixtures'

const BLANK_FOLDER = { dir: 'cookbook', identity: { name: '', email: '' } }

describe('config goals', () => {
  it('see a global setting made outside any repository', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    expect(await meets(sandbox, { kind: 'config-set', key: 'user.name' })).toBe(false)

    await sandbox.run('git config --global user.name "Ada Lovelace"')

    expect(await meets(sandbox, { kind: 'config-set', key: 'user.name' })).toBe(true)
    expect(await meets(sandbox, { kind: 'config-equals', key: 'user.name', value: 'ada lovelace' })).toBe(true)
    expect(await meets(sandbox, { kind: 'config-set', key: 'user.email' })).toBe(false)
  })

  it('prefer a project setting over the global one', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git config user.email "work@example.com"')

    expect(await meets(sandbox, { kind: 'config-equals', key: 'user.email', value: 'work@example.com' })).toBe(true)
  })
})

describe('a blank identity seed', () => {
  it('leaves the name and email unset rather than empty', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)

    expect((await sandbox.run('git config user.name')).outputs).toEqual([])
    expect((await sandbox.run('git config --list')).outputs.map((output) => output.text).join('\n')).not.toMatch(/user\./)
  })
})

describe('not goals', () => {
  it('invert the check they wrap', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)

    expect(await meets(sandbox, { kind: 'not', check: { kind: 'config-set', key: 'user.name' } })).toBe(true)
    await sandbox.run('git config --global user.name "Ada"')
    expect(await meets(sandbox, { kind: 'not', check: { kind: 'config-set', key: 'user.name' } })).toBe(false)
  })
})
