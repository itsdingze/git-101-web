import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'story.md': 'one\n', 'notes.md': 'keep\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git branch side' },
    { run: 'git switch -c feature' },
    { write: { 'story.md': 'feature\n' } },
    { run: 'git commit -am "Feature line"' },
    { run: 'git switch main' },
    { write: { 'story.md': 'main\n' } },
    { run: 'git commit -am "Main line"' },
    { run: 'git branch tip' },
  ],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function midMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git merge feature')
  return sandbox
}

async function resolvedMidMerge(): Promise<Sandbox> {
  const sandbox = await midMerge()
  await sandbox.run('echo "fixed" > story.md')
  await sandbox.run('git add story.md')
  return sandbox
}

const CANNOT_SWITCH = ['fatal: cannot switch branch while merging', 'Consider "git merge --quit" or "git worktree add".'].join('\n')

describe('switching branches during a merge', () => {
  it('refuses git switch, with or without -c, and leaves the merge paused', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git switch side')).toBe(CANNOT_SWITCH)
    expect(await textOf(sandbox, 'git switch -c rescue')).toBe(CANNOT_SWITCH)
    expect(await textOf(sandbox, 'git branch')).toBe('  feature\n* main\n  side\n  tip')
    expect((await sandbox.snapshot()).mergeInProgress).toBe(true)
  })

  it('refuses git checkout of a branch while paths are unmerged', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git checkout side')).toBe(
      'error: you need to resolve your current index first\nstory.md: needs merge',
    )
    expect((await sandbox.snapshot()).branch).toBe('main')
  })

  it('lets git checkout move on once the conflicts are resolved, ending the merge', async () => {
    const sandbox = await resolvedMidMerge()

    expect(await textOf(sandbox, 'git checkout tip')).toBe("M\tstory.md\nSwitched to branch 'tip'")
    const snapshot = await sandbox.snapshot()
    expect(snapshot.mergeInProgress).toBe(false)
    expect(snapshot.branch).toBe('tip')
    expect(snapshot.staged.map((change) => change.path)).toEqual(['story.md'])
  })

  it('lets git checkout -b take the half-done merge to a new branch without the merge state', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git checkout -b rescue')).toBe("Switched to a new branch 'rescue'")
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
    expect(await textOf(sandbox, 'git commit -m x')).toMatch(/^error: Committing is not possible because you have unmerged files\./)
  })
})

describe('git reset during a merge', () => {
  it('refuses a soft reset', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git reset --soft')).toBe('fatal: Cannot do a soft reset in the middle of a merge.')
    expect((await sandbox.snapshot()).mergeInProgress).toBe(true)
  })

  it('ends the merge on a mixed reset and keeps the marked-up file as an edit', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git reset')).toBe('Unstaged changes after reset:\nM\tstory.md')
    const snapshot = await sandbox.snapshot()
    expect(snapshot.mergeInProgress).toBe(false)
    expect(snapshot.unstaged).toEqual([{ path: 'story.md', kind: 'modified' }])
    expect(await textOf(sandbox, 'cat story.md')).toContain('<<<<<<< HEAD')

    await sandbox.run('git commit -am "Later"')
    expect((await sandbox.snapshot()).commits.find((commit) => commit.message === 'Later')?.parents).toHaveLength(1)
  })

  it('ends the merge on a hard reset and puts the files back', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git reset --hard')).toMatch(/^HEAD is now at [0-9a-f]{7} Main line$/)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
    expect(await textOf(sandbox, 'cat story.md')).toBe('main')
    expect(await textOf(sandbox, 'git status')).toBe('On branch main\nnothing to commit, working tree clean')
  })
})

describe('starting another merge during a merge', () => {
  it('refuses while paths are unmerged', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git merge side')).toBe(
      [
        'error: Merging is not possible because you have unmerged files.',
        "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
        'hint: as appropriate to mark resolution and make a commit.',
        'fatal: Exiting because of an unresolved conflict.',
      ].join('\n'),
    )
  })

  it('refuses once resolved but not yet committed', async () => {
    const sandbox = await resolvedMidMerge()

    expect(await textOf(sandbox, 'git merge side')).toBe(
      'fatal: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.',
    )
  })
})
