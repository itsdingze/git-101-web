import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('git init with a first branch name', () => {
  it.each([
    ['git init -b dev', 'dev'],
    ['git init -bdev', 'dev'],
    ['git init --initial-branch dev', 'dev'],
    ['git init --initial-branch=dev', 'dev'],
    ['git init -b main', 'main'],
  ])('%s creates the repository here on that branch', async (line, branch) => {
    const sandbox = await createSandbox({ dir: 'project' })

    expect(await textOf(sandbox, line)).toBe('Initialized empty Git repository in /home/user/project/.git/')

    expect(await textOf(sandbox, 'git status')).toContain(`On branch ${branch}`)
  })

  it('takes a folder as well', async () => {
    const sandbox = await createSandbox({ dir: 'project' })

    expect(await textOf(sandbox, 'git init -b dev sub')).toBe('Initialized empty Git repository in /home/user/project/sub/.git/')
  })

  it('warns and leaves the branch when the repository already exists', async () => {
    const sandbox = await createSandbox({ dir: 'project', setup: [{ run: 'git init -b dev' }] })

    expect(await textOf(sandbox, 'git init -b other')).toBe(
      'warning: re-init: ignored --initial-branch=other\nReinitialized existing Git repository in /home/user/project/.git/',
    )
    expect(await textOf(sandbox, 'git status')).toContain('On branch dev')
  })

  it('refuses an invalid branch name', async () => {
    const sandbox = await createSandbox({ dir: 'project' })

    expect(await textOf(sandbox, 'git init -b a..b')).toBe("fatal: invalid initial branch name: 'a..b'")
    expect(await textOf(sandbox, 'git status')).toContain('not a git repository')
  })

  it('stays quiet with -q', async () => {
    const sandbox = await createSandbox({ dir: 'project' })

    expect(await textOf(sandbox, 'git init -q')).toBe('')
    expect(await textOf(sandbox, 'git status')).toContain('On branch main')
  })
})
