import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

const WITH_FOLDER = ['git init', 'mkdir notes', 'echo a > notes/a', 'echo r > r', 'git add .', 'git commit -m c1']

describe('git rm -r on a folder, matched to git 2.51', () => {
  it('removes the emptied folder so the name can be reused', async () => {
    const sandbox = await playedFrom([...WITH_FOLDER, 'git rm -r -q notes'])

    expect(await textOf(sandbox, 'ls')).toBe('r')
    await sandbox.run('echo x > notes')
    expect(await textOf(sandbox, 'cat notes')).toBe('x')
  })
})
