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
    { run: 'git switch -c feature' },
    { write: { 'story.md': 'feature\n' } },
    { run: 'git commit -am "Feature line"' },
    { run: 'git switch main' },
    { write: { 'story.md': 'main\n' } },
    { run: 'git commit -am "Main line"' },
  ],
}

async function midMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git merge feature')
  return sandbox
}

describe('git stash during a merge', () => {
  it('refuses while a file is still unmerged, like real git', async () => {
    const sandbox = await midMerge()

    expect(await textOf(sandbox, 'git stash')).toBe('error: could not write index\nstory.md: needs merge')
    expect((await sandbox.snapshot()).stashes).toHaveLength(0)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(true)
  })

  it('shelves a resolved merge and ends it, so a later merge starts fresh', async () => {
    const sandbox = await midMerge()
    await sandbox.run('echo "fixed" > story.md')
    await sandbox.run('git add story.md')

    expect(await textOf(sandbox, 'git stash')).toMatch(/^Saved working directory and index state WIP on main: [0-9a-f]{7} Main line$/)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
    expect(await textOf(sandbox, 'git status')).toBe('On branch main\nnothing to commit, working tree clean')
    expect(await textOf(sandbox, 'git merge feature')).toContain('CONFLICT (content): Merge conflict in story.md')
  })
})
