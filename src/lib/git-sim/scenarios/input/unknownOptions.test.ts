import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('options Git does not know', () => {
  it('make git log stop, the way real Git does', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git log --onelin')).toBe('fatal: unrecognized argument: --onelin')
  })

  it('make git diff stop with its own wording', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git diff -staged')).toBe('error: invalid option: -staged')
  })

  it('leave the options the course teaches alone', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git log --oneline --graph -3')).toContain('Initial commit')
    expect(await textOf(sandbox, 'git log --oneline -n 1 --all')).toContain('Initial commit')
    expect(await textOf(sandbox, 'git diff --staged')).toBe('')
    expect(await textOf(sandbox, 'git diff --cached -- index.html')).toBe('')
  })
})
