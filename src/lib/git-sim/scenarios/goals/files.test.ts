import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, EMPTY_SEED, IGNORED_SEED, SECRET_SEED, meets } from '@/lib/git-sim/scenarios/goalFixtures'

describe('file-has-line goals', () => {
  it('pass only when the file holds that exact line', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)
    await sandbox.run('echo "tasks = load()" > app.txt')

    expect(await meets(sandbox, { kind: 'file-has-line', path: 'app.txt', line: 'tasks = load()' })).toBe(true)
    expect(await meets(sandbox, { kind: 'file-has-line', path: 'app.txt', line: 'show(tasks)' })).toBe(false)
  })

  it('fail when curly quotes went into the file', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)
    await sandbox.run('echo “MAX_TASKS = 25” > settings.txt')

    expect(await meets(sandbox, { kind: 'file-has-line', path: 'settings.txt', line: 'MAX_TASKS = 25' })).toBe(false)
  })

  it('fail for a missing file', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await meets(sandbox, { kind: 'file-has-line', path: 'nope.txt', line: 'x' })).toBe(false)
  })
})

describe('file-matches goals', () => {
  const PLAN = { kind: 'file-matches', path: 'plan.py', lines: ['def plan():', '    pass', '', 'def run():'] } as const

  it('pass when the non-blank lines match exactly, whatever the blank lines', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)
    await sandbox.run('echo "def plan():" > plan.py')
    await sandbox.run('echo "    pass" >> plan.py')
    await sandbox.run('echo "" >> plan.py')
    await sandbox.run('echo "" >> plan.py')
    await sandbox.run('echo "def run():" >> plan.py')

    expect(await meets(sandbox, PLAN)).toBe(true)
  })

  it('fail when a line lost its indentation', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)
    await sandbox.run('echo "def plan():" > plan.py')
    await sandbox.run('echo "pass" >> plan.py')
    await sandbox.run('echo "def run():" >> plan.py')

    expect(await meets(sandbox, PLAN)).toBe(false)
  })

  it('fail when a line is missing or extra', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)
    await sandbox.run('echo "def plan():" > plan.py')
    await sandbox.run('echo "def run():" >> plan.py')
    expect(await meets(sandbox, PLAN)).toBe(false)

    await sandbox.run('echo "def plan():" > plan.py')
    await sandbox.run('echo "    pass" >> plan.py')
    await sandbox.run('echo "def run():" >> plan.py')
    await sandbox.run('echo "    pass" >> plan.py')
    expect(await meets(sandbox, PLAN)).toBe(false)
  })

  it('fail for a missing file', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await meets(sandbox, PLAN)).toBe(false)
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
  })

  it('reports nothing tracked outside a repository', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await meets(sandbox, { kind: 'file-tracked', path: 'notes.txt' })).toBe(false)
    expect(await meets(sandbox, { kind: 'file-untracked', path: 'notes.txt' })).toBe(false)
  })
})
