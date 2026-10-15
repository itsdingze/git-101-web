import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const FIRST_COMMIT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    {
      write: {
        'index.html': '<h1>My project</h1>\n',
        'style.css': 'body { margin: 0; }\n',
      },
    },
  ],
}

describe('the first commit loop', () => {
  it('reports both files as untracked before anything is staged', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tindex.html',
        '\tstyle.css',
        '',
        'nothing added to commit but untracked files present (use "git add" to track)',
      ].join('\n'),
    )
  })

  it('moves both files into the staging area with git add .', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git add .')).toBe('')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Changes to be committed:',
        '  (use "git rm --cached <file>..." to unstage)',
        '\tnew file:   index.html',
        '\tnew file:   style.css',
        '',
      ].join('\n'),
    )
  })

  it('records a root commit and reads it back with git log', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('git add .')

    const commit = await textOf(sandbox, 'git commit -m "Initial commit"')
    expect(commit).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] Initial commit$/m)
    expect(commit).toContain('2 files changed, 2 insertions(+)')
    expect(commit).toContain('create mode 100644 index.html')

    expect(await textOf(sandbox, 'git log --oneline')).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main\) Initial commit$/,
    )
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('reaches the commit goal only once both files are committed', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect((await sandbox.snapshot()).commits).toHaveLength(0)

    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.commits[0]?.files).toEqual(['index.html', 'style.css'])
    expect(snapshot.branch).toBe('main')
  })
})

describe('a commit message passed without -m', () => {
  it('is read as a file name, the way real git reads it', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')

    expect(await textOf(sandbox, 'git commit --amend "Add the landing page"')).toBe(
      "error: pathspec 'Add the landing page' did not match any file(s) known to git",
    )
    expect(await textOf(sandbox, 'git commit "Add the landing page"')).toBe(
      "error: pathspec 'Add the landing page' did not match any file(s) known to git",
    )
  })
})
