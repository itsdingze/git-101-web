import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.txt': 'a\n', 'b.txt': 'b\n', 'sub/s.txt': 's\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'a.txt': 'a2\n', 'new.txt': 'n\n', 'sub/s.txt': 's2\n' } },
    { remove: ['b.txt'] },
  ],
}

describe('git add -u', () => {
  it('stages edits and deletions of tracked files, never new files', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git add -u')).toBe('')
    expect(await textOf(sandbox, 'git status --short')).toBe('M  a.txt\nD  b.txt\nM  sub/s.txt\n?? new.txt')
  })

  it('works the same as --update, from any folder', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('cd sub')
    await sandbox.run('git add --update')
    await sandbox.run('cd ..')
    expect(await textOf(sandbox, 'git status --short')).toBe('M  a.txt\nD  b.txt\nM  sub/s.txt\n?? new.txt')
  })

  it('limits to the paths given', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add -u a.txt')
    expect(await textOf(sandbox, 'git status --short')).toBe('M  a.txt\n D b.txt\n M sub/s.txt\n?? new.txt')
  })

  it('refuses a path Git does not track', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git add -u new.txt')).toBe(
      "error: pathspec 'new.txt' did not match any file(s) known to git",
    )
    expect(await textOf(sandbox, 'git status --short')).toBe(' M a.txt\n D b.txt\n M sub/s.txt\n?? new.txt')
  })

  it('says no file matched when the path does not exist at all', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await textOf(sandbox, 'git add -u nothing.txt')).toBe("fatal: pathspec 'nothing.txt' did not match any files")
  })

  it('keeps -A staging new files too', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git add -A')
    expect(await textOf(sandbox, 'git status --short')).toBe('M  a.txt\nD  b.txt\nA  new.txt\nM  sub/s.txt')
  })
})
