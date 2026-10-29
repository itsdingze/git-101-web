import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const FILES = {
  'a.txt': 'a\n',
  'c.txt': 'c\n',
  'sub/b.txt': 'b\n',
  'src/a.py': 'p\n',
  'src/x/b.py': 'q\n',
  'docs/d.md': 'd\n',
}

const UNTRACKED: SandboxSeed = {
  dir: 'project',
  setup: [{ run: 'git init' }, { write: FILES }],
}

const COMMITTED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: FILES },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'a.txt': 'a2\n', 'c.txt': 'c2\n', 'sub/b.txt': 'b2\n', 'docs/d.md': 'd2\n' } },
  ],
}

async function shortStatus(sandbox: Sandbox): Promise<string> {
  return textOf(sandbox, 'git status --short')
}

describe('glob pathspecs', () => {
  it('stages every match of a quoted wildcard, in any folder', async () => {
    const sandbox = await createSandbox(UNTRACKED)
    expect(await textOf(sandbox, 'git add "*.txt"')).toBe('')
    expect(await shortStatus(sandbox)).toBe('A  a.txt\nA  c.txt\nA  sub/b.txt\n?? docs/\n?? src/')
  })

  it('lets * after a folder reach into deeper folders', async () => {
    const sandbox = await createSandbox(UNTRACKED)
    await sandbox.run('git add "src/*.py"')
    expect(await shortStatus(sandbox)).toBe('A  src/a.py\nA  src/x/b.py\n?? a.txt\n?? c.txt\n?? docs/\n?? sub/')
  })

  it('matches ? and [ ] against one character', async () => {
    const sandbox = await createSandbox(UNTRACKED)
    await sandbox.run('git add "?.txt"')
    await sandbox.run('git add "src/[ab].py"')
    expect(await shortStatus(sandbox)).toBe('A  a.txt\nA  c.txt\nA  src/a.py\n?? docs/\n?? src/x/\n?? sub/')
  })

  it('does not treat a wildcard as a folder prefix', async () => {
    const sandbox = await createSandbox(UNTRACKED)
    expect(await textOf(sandbox, 'git add "sr?"')).toBe("fatal: pathspec 'sr?' did not match any files")
  })

  it('applies a wildcard inside the current subfolder only', async () => {
    const sandbox = await createSandbox(UNTRACKED)
    await sandbox.run('cd docs')
    await sandbox.run('git add "*.md"')
    await sandbox.run('cd ..')
    expect(await shortStatus(sandbox)).toBe('A  docs/d.md\n?? a.txt\n?? c.txt\n?? src/\n?? sub/')
  })

  it('removes, restores and commits by wildcard', async () => {
    const sandbox = await createSandbox(COMMITTED)
    expect(await textOf(sandbox, 'git rm --cached "*.md"')).toBe("rm 'docs/d.md'")
    await sandbox.run('git add docs')

    await sandbox.run('git restore "*.txt"')
    expect(await shortStatus(sandbox)).toBe('M  docs/d.md')

    await sandbox.run('echo "a3" > a.txt')
    await sandbox.run('echo "b3" > sub/b.txt')
    await sandbox.run('git restore --staged docs/d.md')
    expect(await textOf(sandbox, 'git commit -m g "*.txt"')).toMatch(/^\[main [0-9a-f]{7}\] g\n 2 files changed, 2 insertions\(\+\), 2 deletions\(-\)$/)
    expect(await shortStatus(sandbox)).toBe(' M docs/d.md')
  })

  it('reports a wildcard that matches nothing', async () => {
    const sandbox = await createSandbox(COMMITTED)
    expect(await textOf(sandbox, 'git restore "*.zzz"')).toBe("error: pathspec '*.zzz' did not match any file(s) known to git")
    expect(await textOf(sandbox, 'git commit -m g "*.zzz"')).toBe("error: pathspec '*.zzz' did not match any file(s) known to git")
  })
})

describe('path forms Git tidies up', () => {
  it('reads ../ and ./ from the current subfolder', async () => {
    const sandbox = await createSandbox(COMMITTED)
    await sandbox.run('cd sub')
    await sandbox.run('git add ../c.txt')
    await sandbox.run('git add ./b.txt')
    await sandbox.run('cd ..')
    expect(await shortStatus(sandbox)).toBe(' M a.txt\nM  c.txt\n M docs/d.md\nM  sub/b.txt')
  })

  it('ignores doubled and trailing slashes', async () => {
    const sandbox = await createSandbox(COMMITTED)
    expect(await textOf(sandbox, 'git add docs//d.md')).toBe('')
    expect(await shortStatus(sandbox)).toBe(' M a.txt\n M c.txt\nM  docs/d.md\n M sub/b.txt')
    await sandbox.run('echo "x" > docs/e.md')
    await sandbox.run('git add sub/')
    await sandbox.run('git add docs/')
    expect(await shortStatus(sandbox)).toBe(' M a.txt\n M c.txt\nM  docs/d.md\nA  docs/e.md\nM  sub/b.txt')
  })

  it('refuses ../ above the repository, naming where the repository is', async () => {
    const sandbox = await createSandbox(COMMITTED)
    expect(await textOf(sandbox, 'git add ../a.txt')).toBe(
      "fatal: ../a.txt: '../a.txt' is outside repository at '/home/user/project'",
    )
    expect(await textOf(sandbox, 'git commit -m x ../a.txt')).toBe(
      "fatal: ../a.txt: '../a.txt' is outside repository at '/home/user/project'",
    )
    expect(await shortStatus(sandbox)).toBe(' M a.txt\n M c.txt\n M docs/d.md\n M sub/b.txt')
  })

  it('still needs -r to remove a folder named with ../', async () => {
    const sandbox = await createSandbox(COMMITTED)
    await sandbox.run('cd sub')
    expect(await textOf(sandbox, 'git rm --cached ../docs')).toBe("fatal: not removing '../docs' recursively without -r")
  })
})
