import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const FIRST_COMMIT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        'index.html': '<h1>My project</h1>\n',
        'style.css': 'body { margin: 0; }\n',
      },
    },
  ],
}

describe('git diff', () => {
  it('shows unstaged edits, then staged edits after git add', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')
    await sandbox.run('echo "<h1>My renamed project</h1>" > index.html')

    const unstaged = await textOf(sandbox, 'git diff')
    expect(unstaged).toContain('diff --git a/index.html b/index.html')
    expect(unstaged).toContain('-<h1>My project</h1>')
    expect(unstaged).toContain('+<h1>My renamed project</h1>')

    expect(await textOf(sandbox, 'git diff --staged')).toBe('')

    await sandbox.run('git add index.html')
    expect(await textOf(sandbox, 'git diff')).toBe('')
    expect(await textOf(sandbox, 'git diff --staged')).toContain('+<h1>My renamed project</h1>')
  })
})
