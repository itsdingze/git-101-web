import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('git config --get and --add', () => {
  it('reads a value with --get', async () => {
    const sandbox = await createSandbox({ dir: 'p', setup: [{ run: 'git init' }, { run: 'git config a.b hello' }] })

    expect(await textOf(sandbox, 'git config --get a.b')).toBe('hello')
  })

  it('adds a value alongside the existing one with --add', async () => {
    const sandbox = await createSandbox({ dir: 'p', setup: [{ run: 'git init' }, { run: 'git config a.b one' }] })

    expect(await textOf(sandbox, 'git config --add a.b two')).toBe('')

    const lines = (await textOf(sandbox, 'git config --local --list')).split('\n')
    expect(lines).toContain('a.b=one')
    expect(lines).toContain('a.b=two')
  })
})
