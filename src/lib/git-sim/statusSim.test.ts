import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const COMMITTED_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const EMPTY_SEED: SandboxSeed = { dir: 'my-project', setup: [{ run: 'git init' }] }

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('git status spacing', () => {
  it('ends on the footer with no trailing blank line when work is unstaged', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "two" > f.txt')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'Changes not staged for commit:',
        '  (use "git add <file>..." to update what will be committed)',
        '  (use "git restore <file>..." to discard changes in working directory)',
        '\tmodified:   f.txt',
        '',
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ].join('\n'),
    )
  })

  it('keeps the section blank line and prints no footer when work is staged', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "new" > s.txt')
    await sandbox.run('git add s.txt')

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tnew file:   s.txt',
        '',
      ].join('\n'),
    )
  })

  it('tells a brand-new repository to create or copy files', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await textOf(sandbox, 'git status')).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'nothing to commit (create/copy files and use "git add" to track)',
      ].join('\n'),
    )
  })
})
