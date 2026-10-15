import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

const WITH_FOLDER = ['git init', 'mkdir notes', 'echo a > notes/a', 'echo r > r', 'git add .', 'git commit -m c1']

describe('git commit -q -am', () => {
  it('commits quietly with the message', async () => {
    const sandbox = await playedFrom([...WITH_FOLDER, 'echo r2 > r'])

    expect(await textOf(sandbox, 'git commit -q -am x')).toBe('')
    expect(await textOf(sandbox, 'git log --oneline -1')).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) x$/)
  })
})
