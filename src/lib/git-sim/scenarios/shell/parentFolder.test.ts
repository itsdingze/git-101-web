import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ write: { 'notes.txt': 'keep me\n' } }],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('creating something inside a file', () => {
  it.each([
    ['mkdir notes.txt/sub', "mkdir: cannot create directory 'notes.txt/sub': Not a directory"],
    ['mkdir -p notes.txt/sub', "mkdir: cannot create directory 'notes.txt/sub': Not a directory"],
    ['touch notes.txt/inside', "touch: cannot touch 'notes.txt/inside': Not a directory"],
  ])('%s is refused', async (line, message) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(message)
    expect(await textOf(sandbox, 'cat notes.txt')).toBe('keep me')
  })
})

describe('creating something inside a missing folder', () => {
  it.each([
    ['mkdir missing/sub', "mkdir: cannot create directory 'missing/sub': No such file or directory"],
    ['touch missing/file.txt', "touch: cannot touch 'missing/file.txt': No such file or directory"],
  ])('%s is refused without creating the folder', async (line, message) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, line)).toBe(message)
    expect(await textOf(sandbox, 'ls')).toBe('notes.txt')
  })

  it('mkdir -p builds every missing folder', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'mkdir -p missing/sub')).toBe('')
    expect(await textOf(sandbox, 'ls missing')).toBe('sub')
  })
})
