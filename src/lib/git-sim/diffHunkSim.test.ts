import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'one\n', 'poem.txt': 'l1\nl2\nl3\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function hunkHeaders(sandbox: Sandbox, line: string): Promise<string[]> {
  const result = await sandbox.run(line)
  return result.outputs
    .flatMap((output) => output.text.split('\n'))
    .filter((text) => text.startsWith('@@'))
}

describe('diff hunk headers', () => {
  it('start an empty side at 0 and drop a count of one, like git', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('rm a.txt')
    await sandbox.run('echo two > b.txt')
    await sandbox.run('git add b.txt')

    expect(await hunkHeaders(sandbox, 'git diff')).toEqual(['@@ -1 +0,0 @@'])
    expect(await hunkHeaders(sandbox, 'git diff --staged')).toEqual(['@@ -0,0 +1 @@'])
  })

  it('keep the count when a side has several lines', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo changed > poem.txt')

    expect(await hunkHeaders(sandbox, 'git diff')).toEqual(['@@ -1,3 +1 @@'])
  })
})
