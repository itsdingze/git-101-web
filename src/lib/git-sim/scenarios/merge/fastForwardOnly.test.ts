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
  ],
}

async function withBranchAhead(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -c work')
  await sandbox.run('echo a > w.txt')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m work')
  await sandbox.run('git switch main')
  return sandbox
}

async function withDivergedBranch(): Promise<Sandbox> {
  const sandbox = await withBranchAhead()
  await sandbox.run('echo b > m.txt')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m main-work')
  return sandbox
}

describe('git merge --ff-only', () => {
  it('fast-forwards when it can', async () => {
    const sandbox = await withBranchAhead()

    expect(await textOf(sandbox, 'git merge --ff-only work')).toContain('Fast-forward')
    expect(await textOf(sandbox, 'git log --oneline -1')).toContain('work')
  })

  it('stops and makes no commit on diverged branches', async () => {
    const sandbox = await withDivergedBranch()

    const result = await sandbox.run('git merge --ff-only work')

    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(true)
    expect(result.outputs.map((output) => output.text).join('\n')).toContain(
      'fatal: Not possible to fast-forward, aborting.',
    )
    expect(await textOf(sandbox, 'git log --oneline -1')).toContain('main-work')
    expect(await textOf(sandbox, 'git status --short')).toBe('')
  })

  it('reports already up to date when there is nothing to do', async () => {
    const sandbox = await withBranchAhead()
    await sandbox.run('git merge work')

    expect(await textOf(sandbox, 'git merge --ff-only work')).toBe('Already up to date.')
  })

  it('lets a later --no-ff replace it', async () => {
    const sandbox = await withDivergedBranch()

    expect(await textOf(sandbox, 'git merge --ff-only --no-ff work')).toContain("Merge made by the 'ort' strategy.")
  })
})
