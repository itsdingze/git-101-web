import { describe, expect, it } from 'vitest'
import { createSandbox } from './createSandbox'
import { COMMITTED_SEED, EMPTY_SEED, IGNORED_SEED, SECRET_SEED, meets } from './goalFixtures'

describe('file-ignored goals', () => {
  it('matches a file named by a rule but not a visible one', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect((await sandbox.snapshot()).ignored).toContain('debug.log')
    expect(await meets(sandbox, { kind: 'file-ignored', path: 'debug.log' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-ignored', path: 'app.js' })).toBe(false)
  })

  it('matches a whole ignored folder by name', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect(await meets(sandbox, { kind: 'file-ignored', path: 'node_modules' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-ignored', path: 'node_modules/' })).toBe(true)
  })

  it('starts failing and starts passing as the rule is written', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "noise" > debug.log')
    expect(await meets(sandbox, { kind: 'file-ignored', path: 'debug.log' })).toBe(false)

    await sandbox.run('echo "*.log" > .gitignore')
    expect(await meets(sandbox, { kind: 'file-ignored', path: 'debug.log' })).toBe(true)
  })

  it('never calls a tracked file ignored', async () => {
    const sandbox = await createSandbox(SECRET_SEED)

    expect(await meets(sandbox, { kind: 'file-ignored', path: '.env' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-tracked', path: '.env' })).toBe(true)
  })
})

describe('file-tracked and file-untracked goals', () => {
  it('splits committed files from working-tree scratch files', async () => {
    const sandbox = await createSandbox(IGNORED_SEED)

    expect((await sandbox.snapshot()).tracked).toEqual(['.gitignore', 'app.js'])
    expect(await meets(sandbox, { kind: 'file-tracked', path: 'app.js' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-untracked', path: 'app.js' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-tracked', path: 'debug.log' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-untracked', path: 'debug.log' })).toBe(true)
  })

  it('counts a staged file as tracked before it is committed', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "scratch" > notes.txt')
    expect(await meets(sandbox, { kind: 'file-untracked', path: 'notes.txt' })).toBe(true)

    await sandbox.run('git add notes.txt')
    expect(await meets(sandbox, { kind: 'file-tracked', path: 'notes.txt' })).toBe(true)
  })

  it('untracks a file once git rm --cached drops it from the index', async () => {
    const sandbox = await createSandbox(SECRET_SEED)
    await sandbox.run('git rm --cached .env')

    expect(await meets(sandbox, { kind: 'file-tracked', path: '.env' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-untracked', path: '.env' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-ignored', path: '.env' })).toBe(true)
  })

  it('reports nothing tracked outside a repository', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await meets(sandbox, { kind: 'file-tracked', path: 'notes.txt' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-untracked', path: 'notes.txt' })).toBe(false)
  })
})
