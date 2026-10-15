import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [{ write: { 'notes.txt': 'keep me\n', 'docs/guide.md': '# Guide\n' } }],
}

describe('a backslash in a path', () => {
  it('escapes the next character, as in bash', async () => {
    const sandbox = await createSandbox(SEED)

    await sandbox.run('touch a\\b')
    expect(await textOf(sandbox, 'ls')).toBe('ab  docs  notes.txt')
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

describe('mv onto a tracked file of the same size', () => {
  it('shows up as a change to the file it replaced', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'a.txt': 'aa\n', 'b.txt': 'bb\n' } }, { run: 'git add .' }, { run: 'git commit -m "init"' }],
    })

    await sandbox.run('mv a.txt b.txt')

    expect(await textOf(sandbox, 'git status -s')).toBe(' D a.txt\n M b.txt')
  })
})

describe('mv onto a tracked file a checkout just wrote', () => {
  it('still shows up as a change to the file it replaced', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'a.txt': 'aa\n', 'b.txt': 'bb\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "init"' },
        { run: 'git switch -c other' },
        { write: { 'b.txt': 'cc\n' } },
        { run: 'git commit -am "change b"' },
        { run: 'git switch main' },
      ],
    })
    await sandbox.run('git switch other')
    await sandbox.run('echo "zz" > a.txt')
    await sandbox.run('git commit -am "change a"')

    await sandbox.run('mv a.txt b.txt')

    expect(await textOf(sandbox, 'git status -s')).toBe(' D a.txt\n M b.txt')
  })
})
