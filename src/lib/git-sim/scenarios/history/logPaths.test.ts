import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add a"' },
    { write: { 'b.txt': 'b\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add b"' },
    { write: { 'a.txt': 'a2\n' } },
    { run: 'git commit -am "Change a"' },
    { write: { 'd/x.txt': 'x\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add d"' },
    { run: 'git rm -q b.txt' },
    { run: 'git commit -m "Remove b"' },
  ],
}

const AMBIGUOUS = (name: string): string =>
  [
    `fatal: ambiguous argument '${name}': unknown revision or path not in the working tree.`,
    "Use '--' to separate paths from revisions, like this:",
    "'git <command> [<revision>...] -- [<file>...]'",
  ].join('\n')

async function subjects(sandbox: Sandbox, line: string): Promise<string> {
  return (await textOf(sandbox, line.replace('git log', 'git log --no-decorate'))).replace(/^[0-9a-f]{7} /gm, '')
}

describe('git log with a path', () => {
  it('lists only the commits that touched the file', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await subjects(sandbox, 'git log --oneline a.txt')).toBe('Change a\nAdd a')
    expect(await subjects(sandbox, 'git log --oneline -- a.txt')).toBe('Change a\nAdd a')
  })

  it('accepts a folder', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await subjects(sandbox, 'git log --oneline d/')).toBe('Add d')
  })

  it('follows a deleted file only after --', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git log --oneline b.txt')).toBe(AMBIGUOUS('b.txt'))
    expect(await subjects(sandbox, 'git log --oneline -- b.txt')).toBe('Remove b\nAdd b')
  })

  it('combines a revision, a path and a count', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await subjects(sandbox, 'git log --oneline -n 1 main -- a.txt')).toBe('Change a')
  })

  it('prints nothing for an unknown path after --, and refuses it without', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git log --oneline -- missing.txt')).toBe('')
    expect(await textOf(sandbox, 'git log --oneline missing.txt')).toBe(AMBIGUOUS('missing.txt'))
  })
})

describe('git log -n with a value that is not a number', () => {
  it('refuses it', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git log -n abc')).toBe("fatal: 'abc': not an integer")
    expect(await textOf(sandbox, 'git log --max-count=abc')).toBe("fatal: 'abc': not an integer")
  })
})
