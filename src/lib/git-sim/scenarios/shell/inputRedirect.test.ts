import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { NO_LOCKS } from '@/lib/git-sim/input/commandLocks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

function learnerSandbox(): Promise<Sandbox> {
  return createSandbox({ dir: '', setup: [{ write: { 'token.txt': 'ghp_practice\n' } }] }, NO_LOCKS, 'navigation-only')
}

describe('reading a file into a command with <', () => {
  it('is allowed in a learner sandbox, and a command that reads nothing ignores it', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'ls < token.txt')).toBe('token.txt')
  })

  it('refuses a file that does not exist, like bash, and runs nothing', async () => {
    const sandbox = await learnerSandbox()

    const result = await sandbox.run('cd documents < ~/missing.txt')

    expect(result.outputs).toEqual([{ stream: 'stderr', text: 'bash: ~/missing.txt: No such file or directory' }])
  })

  it('refuses a < with nothing after it', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'ls <')).toBe("bash: syntax error near unexpected token `newline'")
  })
})
