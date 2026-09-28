import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ write: { 'notes.txt': 'keep me\n', 'docs/guide.md': '# Guide\n' } }],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a backslash in a path', () => {
  it('is an ordinary filename character, not a folder separator', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'mv \\ elsewhere')).toBe(
      "mv: cannot stat '\\': No such file or directory",
    )
    await sandbox.run('touch a\\b')
    expect(await textOf(sandbox, 'ls')).toBe('a\\b  docs  notes.txt')
  })
})

describe('mv a folder onto a file', () => {
  it('refuses and leaves both alone', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'mv docs notes.txt')).toBe(
      "mv: cannot overwrite non-directory 'notes.txt' with directory 'docs'",
    )
    expect(await textOf(sandbox, 'cat notes.txt')).toBe('keep me')
    expect(await textOf(sandbox, 'cat docs/guide.md')).toBe('# Guide')
  })
})

describe('mv to a path whose folder is missing or is a file', () => {
  it.each([
    ['missing/notes.txt', 'No such file or directory'],
    ['notes.txt/inside', 'Not a directory'],
  ])('refuses mv docs %s', async (destination, reason) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `mv docs ${destination}`)).toBe(
      `mv: cannot move 'docs' to '${destination}': ${reason}`,
    )
    expect(await textOf(sandbox, 'ls')).toBe('docs  notes.txt')
  })
})

describe('mv on the folder you are in', () => {
  it('keeps you inside it under its new name', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cd docs')

    expect(await textOf(sandbox, 'mv ../docs ../manual')).toBe('')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user/project/manual')
    expect(await textOf(sandbox, 'ls')).toBe('guide.md')
  })
})

describe('mv onto itself', () => {
  it('refuses to move a file onto itself and keeps it', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'mv notes.txt notes.txt')).toBe(
      "mv: 'notes.txt' and 'notes.txt' are the same file",
    )
    expect(await textOf(sandbox, 'cat notes.txt')).toBe('keep me')
  })

  it.each([
    ['docs docs', 'docs/docs'],
    ['docs docs/inner', 'docs/inner/docs'],
  ])('refuses to move a folder inside itself: mv %s', async (operands, target) => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('mkdir docs/inner')

    expect(await textOf(sandbox, `mv ${operands}`)).toBe(
      `mv: cannot move 'docs' to a subdirectory of itself, '${target}'`,
    )
    expect(await textOf(sandbox, 'cat docs/guide.md')).toBe('# Guide')
  })
})
