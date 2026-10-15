import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

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
