import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git branch cp' },
    { run: 'git branch cq' },
  ],
}

async function withBranchAhead(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -c other')
  await sandbox.run('git commit --allow-empty -m other')
  await sandbox.run('git switch main')
  return sandbox
}

describe('git branch list filters', () => {
  it('lists branches containing a commit', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch --contains HEAD')).toBe('  cp\n  cq\n* main')
  })

  it('treats --contains with no commit as HEAD', async () => {
    const sandbox = await withBranchAhead()

    expect(await textOf(sandbox, 'git branch --contains')).toBe('  cp\n  cq\n* main\n  other')
  })

  it('excludes branches that lack the commit', async () => {
    const sandbox = await withBranchAhead()

    expect(await textOf(sandbox, 'git branch --contains other')).toBe('  other')
  })

  it('lists merged branches', async () => {
    const sandbox = await withBranchAhead()

    expect(await textOf(sandbox, 'git branch --merged')).toBe('  cp\n  cq\n* main')
    expect(await textOf(sandbox, 'git branch --merged main')).toBe('  cp\n  cq\n* main')
  })

  it('lists unmerged branches', async () => {
    const sandbox = await withBranchAhead()

    expect(await textOf(sandbox, 'git branch --no-merged')).toBe('  other')
    expect(await textOf(sandbox, 'git branch --no-merged main')).toBe('  other')
  })

  it('never creates a branch from a filter value', async () => {
    const sandbox = await createSandbox(SEED)

    await sandbox.run('git branch --list foo')
    await sandbox.run('git branch --contains HEAD')

    expect(await textOf(sandbox, 'git branch')).toBe('  cp\n  cq\n* main')
  })

  it('lists branches matching a pattern', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch --list "c*"')).toBe('  cp\n  cq')
    expect(await textOf(sandbox, 'git branch -l "cq"')).toBe('  cq')
    expect(await textOf(sandbox, 'git branch --list foo')).toBe('')
  })

  it('prints only the current branch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch --show-current')).toBe('main')
  })

  it('prints the current branch of an unborn repository', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }] })

    expect(await textOf(sandbox, 'git branch --show-current')).toBe('main')
  })
})
