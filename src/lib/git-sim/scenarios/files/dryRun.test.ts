import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function changed(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('f.txt', 'one\ntwo\n')
  await sandbox.writeFile('new.txt', 'new\n')
  return sandbox
}

describe('git add -n', () => {
  it('names what it would add and stages nothing', async () => {
    const sandbox = await changed()

    expect(await textOf(sandbox, 'git add -n f.txt')).toBe("add 'f.txt'")
    expect(await textOf(sandbox, 'git status --short')).toBe(' M f.txt\n?? new.txt')
  })

  it('reads --dry-run the same way and lists paths in order', async () => {
    const sandbox = await changed()

    expect(await textOf(sandbox, 'git add --dry-run .')).toBe("add 'f.txt'\nadd 'new.txt'")
  })

  it('names a deleted file as a removal', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('rm f.txt')

    expect(await textOf(sandbox, 'git add -n f.txt')).toBe("remove 'f.txt'")
    expect(await textOf(sandbox, 'git status --short')).toBe(' D f.txt')
  })
})

describe('git rm -n', () => {
  it('names what it would remove and removes nothing', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git rm -n f.txt')).toBe("rm 'f.txt'")
    expect(await textOf(sandbox, 'git status --short')).toBe('')
    expect(await sandbox.readFile('f.txt')).toBe('one\n')
  })

  it('reads --dry-run the same way', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git rm --dry-run g.txt')).toBe("rm 'g.txt'")
    expect(await sandbox.readFile('g.txt')).toBe('alpha\n')
  })

  it('still refuses a file with local changes', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('f.txt', 'one\ntwo\n')

    expect(await textOf(sandbox, 'git rm -n f.txt')).toContain('error: the following file has local modifications')
  })
})

describe('git commit --dry-run', () => {
  it('prints the status and records nothing', async () => {
    const sandbox = await changed()
    await sandbox.run('git add f.txt')

    expect(await textOf(sandbox, 'git commit --dry-run -m x')).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tmodified:   f.txt',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tnew.txt',
        '',
      ].join('\n'),
    )
    expect((await textOf(sandbox, 'git log --oneline')).split('\n')).toHaveLength(1)
  })

  it('needs no message', async () => {
    const sandbox = await changed()
    await sandbox.run('git add f.txt')

    expect((await sandbox.run('git commit --dry-run')).outputs.every((output) => output.stream === 'stdout')).toBe(true)
  })

  it('fails when there is nothing to commit', async () => {
    const sandbox = await createSandbox(SEED)

    const result = await sandbox.run('git commit --dry-run -m none')

    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(true)
    expect(result.outputs.map((output) => output.text).join('\n')).toBe('On branch main\nnothing to commit, working tree clean')
  })

  it('shows -a as if it had staged and leaves the index alone', async () => {
    const sandbox = await changed()

    expect(await textOf(sandbox, 'git commit --dry-run -a -m x')).toContain('modified:   f.txt')
    expect(await textOf(sandbox, 'git status --short')).toBe(' M f.txt\n?? new.txt')
  })

  it('shows named paths as if it had staged and leaves the index alone', async () => {
    const sandbox = await changed()

    expect(await textOf(sandbox, 'git commit --dry-run f.txt -m x')).toContain('modified:   f.txt')
    expect(await textOf(sandbox, 'git status --short')).toBe(' M f.txt\n?? new.txt')
  })
})
