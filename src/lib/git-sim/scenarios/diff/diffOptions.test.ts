import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
  ],
}

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH')
}

const APPENDED_HUNK = ['diff --git a/f.txt b/f.txt', 'index HASH..HASH 100644', '--- a/f.txt', '+++ b/f.txt']

async function withAppendedLine(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('f.txt', 'one\ntwo\nthree\nx\n')
  return sandbox
}

async function withSecondCommit(): Promise<Sandbox> {
  const sandbox = await withAppendedLine()
  await sandbox.run('git commit -qam second')
  return sandbox
}

describe('git diff --stat', () => {
  it('summarizes the changes', async () => {
    const sandbox = await withAppendedLine()

    expect(await textOf(sandbox, 'git diff --stat')).toBe(' f.txt | 1 +\n 1 file changed, 1 insertion(+)')
  })

  it('reads two revisions', async () => {
    const sandbox = await withSecondCommit()

    expect(await textOf(sandbox, 'git diff --stat HEAD~1 HEAD')).toBe(' f.txt | 1 +\n 1 file changed, 1 insertion(+)')
  })
})

describe('git diff --name-only', () => {
  it('names the changed files', async () => {
    const sandbox = await withAppendedLine()

    expect(await textOf(sandbox, 'git diff --name-only')).toBe('f.txt')
  })

  it('wins over --stat', async () => {
    const sandbox = await withAppendedLine()

    expect(await textOf(sandbox, 'git diff --stat --name-only')).toBe('f.txt')
  })
})

describe('git diff -U', () => {
  it('uses the context size', async () => {
    const sandbox = await withAppendedLine()

    expect(masked(await textOf(sandbox, 'git diff -U1'))).toBe([...APPENDED_HUNK, '@@ -3 +3,2 @@ two', ' three', '+x'].join('\n'))
  })

  it('reads --unified=', async () => {
    const sandbox = await withAppendedLine()

    expect(masked(await textOf(sandbox, 'git diff --unified=0'))).toBe([...APPENDED_HUNK, '@@ -3,0 +4 @@ three', '+x'].join('\n'))
  })

  it('takes a path', async () => {
    const sandbox = await withAppendedLine()

    expect(masked(await textOf(sandbox, 'git diff -U0 f.txt'))).toBe([...APPENDED_HUNK, '@@ -3,0 +4 @@ three', '+x'].join('\n'))
  })
})

describe('git diff with a revision range', () => {
  const HUNK = [...APPENDED_HUNK, '@@ -1,3 +1,4 @@', ' one', ' two', ' three', '+x'].join('\n')
  const REVERSE = [...APPENDED_HUNK, '@@ -1,4 +1,3 @@', ' one', ' two', ' three', '-x'].join('\n')

  it.each([
    ['git diff HEAD~1..HEAD', HUNK],
    ['git diff HEAD~1..', HUNK],
    ['git diff ..HEAD~1', REVERSE],
    ['git diff HEAD~1...HEAD', HUNK],
    ['git diff --name-only HEAD~1..HEAD --', 'f.txt'],
  ])('reads %s', async (line, expected) => {
    const sandbox = await withSecondCommit()

    expect(masked(await textOf(sandbox, line))).toBe(expected)
  })

  it('leaves an operand after -- as a path', async () => {
    const sandbox = await withAppendedLine()

    expect(await textOf(sandbox, 'git diff --name-only -- f.txt')).toBe('f.txt')
  })

  it('reads a lone .. as the parent folder', async () => {
    const sandbox = await withAppendedLine()
    await sandbox.run('mkdir sub')
    await sandbox.run('cd sub')

    expect(await textOf(sandbox, 'git diff --name-only ..')).toBe('f.txt')
  })
})
