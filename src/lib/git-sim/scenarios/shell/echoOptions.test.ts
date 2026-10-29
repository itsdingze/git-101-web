import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = { dir: 'project' }

describe('echo -n', () => {
  it('writes the text without a trailing newline', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo -n hi > f.txt')

    expect(await sandbox.readFile('f.txt')).toBe('hi')
  })

  it('takes every -n before the text as the option', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'echo -n -nn hi')).toBe('hi')
  })
})

describe('echo with an option it does not know', () => {
  it.each([
    ['echo -x', '-x'],
    ['echo -nx hi', '-nx hi'],
    ['echo -- hi', '-- hi'],
    ['echo hi -n', 'hi -n'],
  ])('prints %j as typed', async (line, printed) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(printed)
  })
})
