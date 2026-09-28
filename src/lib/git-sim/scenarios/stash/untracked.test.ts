import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function project(): Promise<Sandbox> {
  return createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'a.txt': 'base\n', 'notes.md': 'n\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "init"' },
    ],
  })
}

const UNTRACKED_OVERWRITE = [
  'error: The following untracked working tree files would be overwritten by merge:',
  '\tn.txt',
  'Please move or remove them before you merge.',
  'Aborting',
].join('\n')

describe('popping a stashed new file over an untracked file of the same name', () => {
  it('refuses before touching anything, like real git', async () => {
    const sandbox = await project()
    await sandbox.run('echo "n" > n.txt')
    await sandbox.run('git add n.txt')
    await sandbox.run('git stash')
    await sandbox.run('echo "mine" > n.txt')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output.startsWith(UNTRACKED_OVERWRITE)).toBe(true)
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(await textOf(sandbox, 'cat n.txt')).toBe('mine')
    expect(await textOf(sandbox, 'git status -s')).toBe('?? n.txt')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })

  it('refuses the same way after new commits', async () => {
    const sandbox = await project()
    await sandbox.run('echo "n" > n.txt')
    await sandbox.run('git add n.txt')
    await sandbox.run('git stash')
    await sandbox.run('echo "more" > a.txt')
    await sandbox.run('git commit -am "more"')
    await sandbox.run('echo "mine" > n.txt')

    expect((await textOf(sandbox, 'git stash pop')).startsWith(UNTRACKED_OVERWRITE)).toBe(true)
    expect(await textOf(sandbox, 'cat n.txt')).toBe('mine')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })
})

describe('popping a stash that only holds untracked files', () => {
  it('says the tracked side is already up to date, then restores the files', async () => {
    const sandbox = await project()
    await sandbox.run('echo "u" > u.txt')
    await sandbox.run('git stash -u')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output.split('\n')[0]).toBe('Already up to date.')
    expect(output).toMatch(/Dropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/)
    expect(await textOf(sandbox, 'git status -s')).toBe('?? u.txt')
  })

  it('leaves the index alone when a stashed untracked file is now committed', async () => {
    const sandbox = await project()
    await sandbox.run('echo "u" > u.txt')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "tracked" > u.txt')
    await sandbox.run('git add u.txt')
    await sandbox.run('git commit -m "Add u"')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain(
      'Already up to date.\nu.txt already exists, no checkout\nerror: could not restore untracked files from stash',
    )
    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat u.txt')).toBe('tracked')
    expect((await sandbox.snapshot()).stashes).toHaveLength(1)
  })

  it('restores the untracked files that are not in the way', async () => {
    const sandbox = await project()
    await sandbox.run('echo "u1" > u1.txt')
    await sandbox.run('echo "u2" > u2.txt')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "mine" > u1.txt')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain('u1.txt already exists, no checkout')
    expect(await textOf(sandbox, 'git status -s')).toBe('?? u1.txt\n?? u2.txt')
    expect(await textOf(sandbox, 'cat u1.txt')).toBe('mine')
    expect(await textOf(sandbox, 'cat u2.txt')).toBe('u2')
  })
})

describe('a conflicted pop of a stash with untracked files', () => {
  async function conflictedWithUntracked(): Promise<Sandbox> {
    const sandbox = await project()
    await sandbox.run('echo "stashed" > a.txt')
    await sandbox.run('echo "u" > u.txt')
    await sandbox.run('git stash -u')
    await sandbox.run('echo "committed" > a.txt')
    await sandbox.run('git commit -am "c"')
    return sandbox
  }

  it('brings the untracked file back untracked', async () => {
    const sandbox = await conflictedWithUntracked()

    expect(await textOf(sandbox, 'git stash pop')).toContain('CONFLICT (content): Merge conflict in a.txt')
    expect(await textOf(sandbox, 'git status -s')).toBe('UU a.txt\n?? u.txt')
  })

  it('reports the conflict and then the untracked clash', async () => {
    const sandbox = await conflictedWithUntracked()
    await sandbox.run('echo "mine" > u.txt')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain(
      'Auto-merging a.txt\nCONFLICT (content): Merge conflict in a.txt\nu.txt already exists, no checkout\nerror: could not restore untracked files from stash',
    )
    expect(await textOf(sandbox, 'git status -s')).toBe('UU a.txt\n?? u.txt')
    expect(await textOf(sandbox, 'cat u.txt')).toBe('mine')
  })
})

describe('git stash with pathspecs', () => {
  it('does not know an untracked file unless -u is given', async () => {
    const sandbox = await project()
    await sandbox.run('echo "u" > u.txt')

    expect(await textOf(sandbox, 'git stash push u.txt')).toBe(
      "error: pathspec ':(prefix:0)u.txt' did not match any file(s) known to git\nDid you forget to 'git add'?",
    )
    expect(await textOf(sandbox, 'git stash push -u u.txt')).toMatch(/^Saved working directory and index state WIP on main/)
  })

  it('treats `git stash -- <path>` as a push of that path', async () => {
    const sandbox = await project()
    await sandbox.run('echo "x" > a.txt')
    await sandbox.run('echo "b" > b.txt')
    await sandbox.run('git add b.txt')

    expect(await textOf(sandbox, 'git stash -- a.txt')).toMatch(/^Saved working directory and index state WIP on main/)
    expect(await textOf(sandbox, 'git status -s')).toBe('A  b.txt')
  })

  it('accepts flags before the `--`', async () => {
    const sandbox = await project()
    await sandbox.run('echo "u" > u.txt')
    await sandbox.run('echo "v" > v.txt')

    expect(await textOf(sandbox, 'git stash -u -- u.txt')).toMatch(/^Saved working directory and index state WIP on main/)
    expect(await textOf(sandbox, 'git status -s')).toBe('?? v.txt')
  })

  it('keeps a paused merge going when only some paths are stashed', async () => {
    const sandbox = await project()
    await sandbox.run('git switch -c feature')
    await sandbox.run('echo "feat" > a.txt')
    await sandbox.run('git commit -am "feat"')
    await sandbox.run('git switch main')
    await sandbox.run('echo "main" > a.txt')
    await sandbox.run('git commit -am "main"')
    await sandbox.run('git merge feature')
    await sandbox.run('echo "resolved" > a.txt')
    await sandbox.run('git add a.txt')
    await sandbox.run('echo "n3" > notes.md')

    await sandbox.run('git stash push notes.md')

    expect((await sandbox.snapshot()).mergeInProgress).toBe(true)
    expect(await textOf(sandbox, 'git status')).toContain('All conflicts fixed but you are still merging.')
  })
})
