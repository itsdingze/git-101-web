import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('git stash -u after a tracked folder became a file', () => {
  it('shelves both and leaves a clean folder with the folder back', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { a: 'a\n', 'docs/readme.md': 'r\n' } },
        { run: 'git add .' },
        { run: 'git commit -m c1' },
      ],
    })
    await sandbox.run('rm -r docs')
    await sandbox.run('echo "x" > docs')

    await sandbox.run('git stash -u')

    expect(await textOf(sandbox, 'git status -s')).toBe('')
    expect(await textOf(sandbox, 'cat docs/readme.md')).toBe('r')
  })
})

describe('git stash pop when a file sits where a stashed untracked folder goes', () => {
  it('restores the tracked change, refuses the untracked part like real git, and keeps the entry', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { a: 'a\n' } },
        { run: 'git add .' },
        { run: 'git commit -m c1' },
      ],
    })
    await sandbox.run('echo "a2" > a')
    await sandbox.run('mkdir notes')
    await sandbox.run('echo "k" > notes/k.txt')
    await sandbox.run('git stash -u')
    await sandbox.run('rm -r notes')
    await sandbox.run('echo "n" > notes')
    await sandbox.run('git add notes')
    await sandbox.run('git commit -m n')

    const output = await textOf(sandbox, 'git stash pop')

    expect(output).toContain(
      "fatal: cannot create directory at 'notes': File exists\nerror: could not restore untracked files from stash",
    )
    expect(output).toContain('\tmodified:   a')
    expect(output).toContain('The stash entry is kept in case you need it again.')
    expect(output).not.toMatch(/ENOTDIR|EISDIR/)
    expect(await textOf(sandbox, 'cat a')).toBe('a2')
    expect(await textOf(sandbox, 'git stash list')).toMatch(/^stash@\{0\}/)
  })
})
