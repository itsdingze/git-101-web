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

describe('shell commands', () => {
  it('lists files, prints the working directory, and reads a file', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)

    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user/my-project')
    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
    expect(await textOf(sandbox, 'cat missing.txt')).toBe(
      'cat: missing.txt: No such file or directory',
    )
  })

  it('writes a file through output redirection', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('echo "hello there" > notes.txt')

    expect(await textOf(sandbox, 'cat notes.txt')).toBe('hello there')
    expect(await textOf(sandbox, 'git status')).toContain('notes.txt')
  })

  it('never escapes the sandbox root', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('cd ../../..')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user')
  })
})
