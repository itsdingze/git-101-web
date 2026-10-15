import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

describe('git config with too many words', () => {
  it('refuses four values after the key, like git 2.51', async () => {
    const sandbox = await playedFrom(['git init'])

    expect(await textOf(sandbox, 'git config user.name A B C')).toBe('error: no action specified')
    expect(await textOf(sandbox, 'git config user.name')).toBe('Your Name')
  })
})
