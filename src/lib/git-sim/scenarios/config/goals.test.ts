import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/scenarios/goalFixtures'

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

describe('config-cut-short goals', () => {
  const cutShort = { kind: 'config-cut-short', key: 'user.name' } as const

  it('see a name whose unquoted second word was dropped', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    await sandbox.run('git config --global user.name Ada Lovelace')

    expect(await meets(sandbox, { kind: 'config-equals', key: 'user.name', value: 'Ada' })).toBe(true)
    expect(await meets(sandbox, cutShort)).toBe(true)
  })

  it('stay true while other settings change', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    await sandbox.run('git config --global user.name Ada Lovelace')
    await sandbox.run('git config --global user.email "ada@example.com"')

    expect(await meets(sandbox, cutShort)).toBe(true)
  })

  it('clear once the name is set again in quotes', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    await sandbox.run('git config --global user.name Ada Lovelace')
    await sandbox.run('git config --global user.name "Ada Lovelace"')

    expect(await meets(sandbox, cutShort)).toBe(false)
  })

  it('accept a one-word name typed on purpose', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    await sandbox.run('git config --global user.name Ada')

    expect(await meets(sandbox, cutShort)).toBe(false)
  })
})

describe('config-multi-valued goals', () => {
  const multiValued = { kind: 'config-multi-valued', key: 'user.name' } as const

  it('see two names left by a second unquoted attempt, until --replace-all', async () => {
    const sandbox = await createSandbox(BLANK_FOLDER)
    await sandbox.run('git config --global user.name Ada Lovelace')
    expect(await meets(sandbox, multiValued)).toBe(false)

    await sandbox.run('git config --global user.name Ada Lovelace')
    expect(await meets(sandbox, multiValued)).toBe(true)

    await sandbox.run('git config --global --replace-all user.name "Ada Lovelace"')
    expect(await meets(sandbox, multiValued)).toBe(false)
  })

  it('see two names in the project config', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git config user.name Grace')
    await sandbox.run('git config user.name Ada Lovelace')

    expect(await meets(sandbox, multiValued)).toBe(true)
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
