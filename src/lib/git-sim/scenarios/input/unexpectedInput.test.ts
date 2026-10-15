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

describe('unexpected input', () => {
  it('answers an unknown shell command the way bash does', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'banana')).toBe('bash: banana: command not found')
  })

  it('treats names of built-in object properties as unknown commands', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)

    expect(await textOf(sandbox, 'toString')).toBe('bash: toString: command not found')
    expect(await textOf(sandbox, 'git constructor')).toMatch(/^git: 'constructor' is not a git command\. See 'git --help'\./)
    expect(await textOf(sandbox, 'gh constructor')).toBe('unknown command "constructor" for "gh"')
    expect(await textOf(sandbox, 'gh auth toString')).toBe('unknown command "toString" for "gh auth"')
    expect(await textOf(sandbox, 'git stash toString')).toContain("unexpected token 'toString'")
  })

  it('suggests the closest git command for a typo', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git stats')).toBe(
      ["git: 'stats' is not a git command. See 'git --help'.", '', 'The most similar command is', '\tstatus'].join('\n'),
    )
  })

  it('names commands it deliberately does not simulate', async () => {
    const sandbox = await createSandbox(FIRST_COMMIT_SEED)
    expect(await textOf(sandbox, 'git rebase main')).toContain("doesn't simulate it")
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
