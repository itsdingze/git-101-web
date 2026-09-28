import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a stash pop that stops on a conflict', () => {
  it('stages every change that merged cleanly, like real git', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'd.md': 'd\n', 'n.md': 'n\n', 'sub/s.md': 's\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
      ],
    })
    await sandbox.run('echo "d-stash" > d.md')
    await sandbox.run('echo "n-stash" > n.md')
    await sandbox.run('echo "s-stash" > sub/s.md')
    await sandbox.run('echo "x" > x.md')
    await sandbox.run('git add x.md')
    await sandbox.run('git stash')
    await sandbox.run('echo "d-commit" > d.md')
    await sandbox.run('git commit -am "Clash"')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('CONFLICT (content): Merge conflict in d.md')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'git status -s')).toBe('UU d.md\nM  n.md\nM  sub/s.md\nA  x.md')
  })
})

describe('a stash pop whose untracked file is in the way', () => {
  it('still brings back the tracked changes before refusing the untracked one', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'desserts.md': 'd\n' } }, { run: 'git add .' }, { run: 'git commit -m "Initial commit"' }],
    })
    await sandbox.run('echo "d2" > desserts.md')
    await sandbox.run('echo "p" > pavlova.md')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "mine" > pavlova.md')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('pavlova.md already exists, no checkout')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M desserts.md\n?? pavlova.md')
    expect(await textOf(sandbox, 'cat desserts.md')).toBe('d2')
    expect(await textOf(sandbox, 'cat pavlova.md')).toBe('mine')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })
})

describe('a stash pop whose untracked file is in the way after new commits', () => {
  it('merges the tracked changes, refuses the untracked file, and keeps the entry', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'desserts.md': 'd\n', 't.md': 't\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
      ],
    })
    await sandbox.run('echo "d2" > desserts.md')
    await sandbox.run('echo "p" > pavlova.md')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "t2" > t.md')
    await sandbox.run('git commit -am "Moved"')
    await sandbox.run('echo "mine" > pavlova.md')

    expect(await textOf(sandbox, 'git stash pop')).toContain('pavlova.md already exists, no checkout')
    expect(await textOf(sandbox, 'git status -s')).toBe(' M desserts.md\n?? pavlova.md')
    expect(await textOf(sandbox, 'cat pavlova.md')).toBe('mine')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })
})

describe('git stash push with a path', () => {
  it('shelves only the named file and leaves the rest of your work in place', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'story.md': 'one\n', 'notes.md': 'keep\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
      ],
    })
    await sandbox.run('echo "edit" > notes.md')
    await sandbox.run('echo "edit2" > story.md')

    expect(await textOf(sandbox, 'git stash push notes.md')).toMatch(
      /^Saved working directory and index state WIP on main: [0-9a-f]{7} Initial commit$/,
    )
    expect(await textOf(sandbox, 'git status -s')).toBe(' M story.md')
    expect(await textOf(sandbox, 'cat notes.md')).toBe('keep')

    await sandbox.run('git stash pop')
    expect(await textOf(sandbox, 'cat notes.md')).toBe('edit')
    expect(await textOf(sandbox, 'cat story.md')).toBe('edit2')
  })

  it('refuses a path that matches nothing Git knows about', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'notes.md': 'keep\n' } }, { run: 'git add .' }, { run: 'git commit -m "Initial commit"' }],
    })
    await sandbox.run('echo "edit" > notes.md')

    expect(await textOf(sandbox, 'git stash push nope.md')).toBe(
      "error: pathspec ':(prefix:0)nope.md' did not match any file(s) known to git\nDid you forget to 'git add'?",
    )
    expect((await sandbox.snapshot()).stashes).toHaveLength(0)
  })
})
