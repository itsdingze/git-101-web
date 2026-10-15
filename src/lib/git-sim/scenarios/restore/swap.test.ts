import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const FILE_AND_FOLDER: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { a: 'a\n', 'd/x': 'x\n' } },
    { run: 'git add .' },
    { run: 'git commit -m c1' },
  ],
}

async function fileBecameFolder(): Promise<Sandbox> {
  const sandbox = await createSandbox(FILE_AND_FOLDER)
  await sandbox.run('rm a')
  await sandbox.run('mkdir a')
  await sandbox.run('echo "x" > a/in')
  return sandbox
}

async function folderBecameFile(): Promise<Sandbox> {
  const sandbox = await createSandbox(FILE_AND_FOLDER)
  await sandbox.run('rm -r d')
  await sandbox.run('echo "f" > d')
  return sandbox
}

const DELETED_A = [
  'diff --git a/a b/a',
  'deleted file mode 100644',
  'index 7898192..0000000',
  '--- a/a',
  '+++ /dev/null',
  '@@ -1 +0,0 @@',
  '-a',
].join('\n')

describe('a tracked file replaced by a folder', () => {
  it('shows the file as deleted in git diff and git diff HEAD', async () => {
    const sandbox = await fileBecameFolder()

    expect(await textOf(sandbox, 'git diff')).toBe(DELETED_A)
    expect(await textOf(sandbox, 'git diff HEAD')).toBe(DELETED_A)
  })

  it('brings the file back with git restore', async () => {
    const sandbox = await fileBecameFolder()

    expect(await textOf(sandbox, 'git restore a')).toBe('')
    expect(await textOf(sandbox, 'cat a')).toBe('a')
    expect(await textOf(sandbox, 'git status -s')).toBe('')
  })
})

describe('a tracked folder replaced by a file', () => {
  it('brings the folder back with git restore of a path inside it', async () => {
    const sandbox = await folderBecameFile()

    expect(await textOf(sandbox, 'git restore d/x')).toBe('')
    expect(await textOf(sandbox, 'cat d/x')).toBe('x')
  })

  it('brings it back with git restore . as well, without leaking errors', async () => {
    const all = await folderBecameFile()
    expect(await textOf(all, 'git restore .')).toBe('')
    expect(await textOf(all, 'cat d/x')).toBe('x')
  })
})
