import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed, type Sandbox } from './createSandbox'

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

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
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

describe('unexpected input', () => {
  it('answers an unknown shell command the way bash does', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'banana')).toBe('bash: banana: command not found')
  })

  it('suggests the closest git command for a typo', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git stats')).toBe(
      ["git: 'stats' is not a git command. See 'git --help'.", '', 'The most similar command is', '\tstatus'].join('\n'),
    )
  })

  it('names commands it deliberately does not simulate', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git rebase main')).toContain('does not simulate it')
  })

  it('refuses git commands outside a repository the way git does', async () => {
    const sandbox = await createSandbox({ dir: 'my-project', setup: [{ write: { 'a.txt': 'hi\n' } }] })
    expect(await textOf(sandbox, 'git status')).toBe(
      'fatal: not a git repository (or any of the parent directories): .git',
    )
  })

  it('prints the status when a commit has nothing staged', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git commit -m "nothing"')).toContain(
      'nothing added to commit but untracked files present',
    )
  })

  it('survives the user deleting a tracked file and restores it', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')

    await sandbox.run('rm index.html')
    expect(await textOf(sandbox, 'git status')).toContain('deleted:    index.html')

    await sandbox.run('git restore index.html')
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('keeps working after the whole .git directory is removed', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('rm -rf .git')

    expect(await textOf(sandbox, 'git status')).toBe(
      'fatal: not a git repository (or any of the parent directories): .git',
    )
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')

    await sandbox.reset()
    expect(await textOf(sandbox, 'git status')).toContain('No commits yet')
  })
})

describe('shell commands', () => {
  it('lists files, prints the working directory, and reads a file', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)

    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user/my-project')
    expect(await textOf(sandbox, 'cat style.css')).toBe('body { margin: 0; }')
    expect(await textOf(sandbox, 'cat missing.txt')).toBe(
      'cat: missing.txt: No such file or directory',
    )
  })

  it('writes a file through output redirection', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('echo "hello there" > notes.txt')

    expect(await textOf(sandbox, 'cat notes.txt')).toBe('hello there')
    expect(await textOf(sandbox, 'git status')).toContain('notes.txt')
  })

  it('never escapes the sandbox root', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('cd ../../..')
    expect(await textOf(sandbox, 'pwd')).toBe('/home/user')
  })
})

describe('git diff', () => {
  it('shows unstaged edits, then staged edits after git add', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Initial commit"')
    await sandbox.run('echo "<h1>My renamed project</h1>" > index.html')

    const unstaged = await textOf(sandbox, 'git diff')
    expect(unstaged).toContain('diff --git a/index.html b/index.html')
    expect(unstaged).toContain('-<h1>My project</h1>')
    expect(unstaged).toContain('+<h1>My renamed project</h1>')

    expect(await textOf(sandbox, 'git diff --staged')).toBe('')

    await sandbox.run('git add index.html')
    expect(await textOf(sandbox, 'git diff')).toBe('')
    expect(await textOf(sandbox, 'git diff --staged')).toContain('+<h1>My renamed project</h1>')
  })
})
