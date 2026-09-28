import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ run: 'git init' }, { write: { 'notes.txt': 'keep me\n', 'docs/guide.md': '# Guide\n' } }],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('rm on the folder you are in', () => {
  it.each(['.', '..'])('refuses rm -r %s and leaves the sandbox usable', async (target) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `rm -r ${target}`)).toBe(
      `rm: refusing to remove '.' or '..' directory: skipping '${target}'`,
    )
    expect((await sandbox.snapshot()).isRepo).toBe(true)
  })

  it('moves you up to the parent when a path removes the folder you are in', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cd docs')

    expect(await textOf(sandbox, 'rm -r ../docs')).toBe('')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user/project')
    expect((await sandbox.prompt()).directory).toBe('~/project')
    expect((await sandbox.snapshot()).isRepo).toBe(true)
  })
})
