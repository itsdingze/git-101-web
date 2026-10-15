import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'notes.txt': 'first draft\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add notes"' },
    { write: { '.gitignore': 'notes.txt\n', 'notes.txt': 'second draft\n' } },
  ],
}

describe('a tracked file that .gitignore also matches', () => {
  it('is still staged by git commit -a, since ignoring only affects untracked files', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git commit -am "Update notes"')).toMatch(/^\[main [0-9a-f]{7}\] Update notes$/m)
    expect(await textOf(sandbox, 'git status --short')).toBe('?? .gitignore')
  })
})
