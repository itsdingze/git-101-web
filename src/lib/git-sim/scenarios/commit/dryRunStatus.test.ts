import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

async function withStagedChange(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('f.txt', 'one\ntwo\n')
  await sandbox.run('git add f.txt')
  return sandbox
}

const STAGED_F = ['Changes to be committed:', '  (use "git restore --staged <file>..." to unstage)', '\tmodified:   f.txt', '']

describe('git commit --dry-run', () => {
  it('still prints the status with -q', async () => {
    const sandbox = await withStagedChange()

    expect(await textOf(sandbox, 'git commit --dry-run -q')).toBe(['On branch main', ...STAGED_F].join('\n'))
  })

  it('compares against the parent with --amend', async () => {
    const sandbox = await withStagedChange()
    await sandbox.run('git commit -qm second')

    expect(await textOf(sandbox, 'git commit --dry-run --amend')).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --source=HEAD^1 --staged <file>..." to unstage)',
        '\tmodified:   f.txt',
        '',
      ].join('\n'),
    )
  })

  it('shows an amended root commit as the initial commit', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git commit --dry-run --amend -m x')).toBe(
      [
        'On branch main',
        '',
        'Initial commit',
        '',
        'Changes to be committed:',
        '  (use "git rm --cached <file>..." to unstage)',
        '\tnew file:   f.txt',
        '\tnew file:   g.txt',
        '',
      ].join('\n'),
    )
  })

  it('says Initial commit on an unborn branch', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }, { write: { 'a.txt': 'a\n' } }, { run: 'git add .' }] })

    expect(await textOf(sandbox, 'git commit --dry-run -m x')).toBe(
      ['On branch main', '', 'Initial commit', '', 'Changes to be committed:', '  (use "git rm --cached <file>..." to unstage)', '\tnew file:   a.txt', ''].join('\n'),
    )
  })

  it('leaves git status saying No commits yet on an unborn branch', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init' }, { write: { 'a.txt': 'a\n' } }, { run: 'git add .' }] })

    expect(await textOf(sandbox, 'git status')).toContain('No commits yet')
  })
})
