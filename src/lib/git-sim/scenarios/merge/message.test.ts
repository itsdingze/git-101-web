import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of lines) await sandbox.run(line)
  return sandbox
}

const WITH_FOLDER = ['git init', 'mkdir notes', 'echo a > notes/a', 'echo r > r', 'git add .', 'git commit -m c1']

describe('git merge with -m', () => {
  it('uses the given message for the merge commit', async () => {
    const sandbox = await playedFrom([
      ...WITH_FOLDER,
      'git switch -c f',
      'echo f > f',
      'git add f',
      'git commit -m f',
      'git switch main',
      'echo m > m',
      'git add m',
      'git commit -m m',
    ])

    await sandbox.run('git merge f -m "Bring in f"')

    expect(await textOf(sandbox, 'git log --oneline -1')).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) Bring in f$/)
  })
})
