import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/goals/goalFixtures'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

const NO_BACKSLASH_NAMES = 'This practice terminal does not allow \\ in file or folder names.'

describe('a backslash at the end of a line', () => {
  it('explains that the terminal runs one line at a time, and does nothing', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'mkdir \\')).toBe(
      'A \\ at the end of a line tells a real terminal to wait for more. This practice terminal runs one line at a time, so leave it off.',
    )
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
  })
})

describe('names with a backslash in them', () => {
  it.each([
    "mkdir 'a\\b'",
    "touch 'a\\b'",
    "echo hi > 'a\\b'",
    "mv index.html 'a\\b'",
  ])('are refused: %s', async (line) => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, line)).toBe(NO_BACKSLASH_NAMES)
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
  })

  it('still allows a backslash inside file contents', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "a\\b" > notes.txt')

    expect(await textOf(sandbox, 'cat notes.txt')).toBe('a\\b')
  })
})
