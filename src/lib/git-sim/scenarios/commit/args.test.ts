import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/goals/goalFixtures'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a commit flag that is missing its message', () => {
  it.each(['git commit -m', 'git commit -am', 'git commit --message'])(
    '%s fails the way git does and records nothing',
    async (line) => {
      const sandbox = await createSandbox(COMMITTED_SEED)
      await sandbox.run('echo "changed" > index.html')

      const expected = line.endsWith('--message')
        ? "error: option `message' requires a value"
        : "error: switch `m' requires a value"
      expect(await textOf(sandbox, line)).toBe(expected)
      expect((await sandbox.snapshot()).commits).toHaveLength(1)
    },
  )
})
