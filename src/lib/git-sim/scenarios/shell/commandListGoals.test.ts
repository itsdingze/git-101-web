import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ run: 'git init' }, { write: { 'notes.txt': 'hi\n' } }],
}

describe('goals after a command list', () => {
  it('judge the last command that ran, not the first', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add . && git commit -m "x"')
    const snapshot = await sandbox.snapshot()

    expect(evaluateGoal({ kind: 'last-command', startsWith: 'git commit' }, snapshot)).toBe(true)
    expect(evaluateGoal({ kind: 'last-command', startsWith: 'git add' }, snapshot)).toBe(false)
  })

  it('count the list as succeeded when || recovered from a failure', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cat missing.txt || git status')

    expect(evaluateGoal({ kind: 'last-command', startsWith: 'git status' }, await sandbox.snapshot())).toBe(true)
  })

  it('read the commit named by the last command that ran', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add . && git commit -m "add notes"')
    await sandbox.run('git status && git show HEAD')

    const check = { kind: 'last-command', startsWith: 'git show', namesCommit: { messageIncludes: 'add notes' } } as const
    expect(evaluateGoal(check, await sandbox.snapshot())).toBe(true)
  })

  it('judge the command that failed when && stopped the list', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cat missing.txt && git status')
    const snapshot = await sandbox.snapshot()

    expect(evaluateGoal({ kind: 'last-command', startsWith: 'git status' }, snapshot)).toBe(false)
    expect(evaluateGoal({ kind: 'last-command', startsWith: 'cat', allowFailure: true }, snapshot)).toBe(true)
  })
})
