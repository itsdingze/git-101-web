import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const CLONED: SandboxSeed = {
  dir: 'work',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/work.git',
    setup: [{ write: { a: 'a\n' } }, { run: 'git add a' }, { run: 'git commit -m c1' }],
  },
}

describe('git status after the tracking line, matched to git 2.51', () => {
  it('puts a blank line before "nothing to commit"', async () => {
    const sandbox = await createSandbox(CLONED)

    expect(await textOf(sandbox, 'git status')).toBe(
      ["On branch main", "Your branch is up to date with 'origin/main'.", '', 'nothing to commit, working tree clean'].join('\n'),
    )
  })

  it('puts a blank line before the untracked list', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('echo b > b')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        "Your branch is up to date with 'origin/main'.",
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tb',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
  })

  it('adds the pull advice and a blank line when the branches have diverged', async () => {
    const sandbox = await createSandbox({
      ...CLONED,
      setup: [{ write: { b: 'b\n' } }, { run: 'git add b' }, { run: 'git commit -m c2' }, { run: 'git push' }],
    })
    await sandbox.run('git commit --amend -m c2b')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        "Your branch and 'origin/main' have diverged,",
        'and have 1 and 1 different commits each, respectively.',
        '  (use "git pull" if you want to integrate the remote branch with yours)',
        '',
        'nothing to commit, working tree clean',
      ].join('\n'),
    )
  })

  it('says the branch can be fast-forwarded once a refused pull has fetched the new commit', async () => {
    const sandbox = await createSandbox({
      dir: 'work',
      remote: {
        name: 'origin',
        url: 'https://github.com/team/work.git',
        setup: [{ write: { a: 'a\n' } }, { run: 'git add a' }, { run: 'git commit -m c1' }],
        ahead: [{ write: { a: 'theirs\n' } }, { run: 'git commit -am c2' }],
      },
      setup: [{ write: { a: 'mine\n' } }],
    })
    await sandbox.run('git pull')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        "Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.",
        '  (use "git pull" to update your local branch)',
        '',
        'Changes not staged for commit:',
        '  (use "git add <file>..." to update what will be committed)',
        '  (use "git restore <file>..." to discard changes in working directory)',
        '\tmodified:   a',
        '',
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ].join('\n'),
    )
  })

  it('puts a blank line after the push advice when ahead', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('echo b > b')
    await sandbox.run('git add b')
    await sandbox.run('git commit -m c2')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        "Your branch is ahead of 'origin/main' by 1 commit.",
        '  (use "git push" to publish your local commits)',
        '',
        'nothing to commit, working tree clean',
      ].join('\n'),
    )
  })
})
