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

const UNRESOLVED_COMMIT = [
  'error: Committing is not possible because you have unmerged files.',
  "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
  'hint: as appropriate to mark resolution and make a commit.',
  'fatal: Exiting because of an unresolved conflict.',
  'U\tstory.md',
].join('\n')

async function midMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git merge feature')
  return sandbox
}

describe('a conflicted file whose text matches the common ancestor', () => {
  it('stays unmerged until it is added', async () => {
    const sandbox = await midMerge()
    await sandbox.run('echo "one" > story.md')

    expect(await textOf(sandbox, 'git status -s')).toBe('UU story.md')
    expect(await textOf(sandbox, 'git status -s')).toBe('UU story.md')
    expect(await textOf(sandbox, 'git commit -m x')).toBe(UNRESOLVED_COMMIT)
  })
})

describe('git commit with unmerged files', () => {
  it('lists each unmerged file after the refusal, like real git', async () => {
    expect(await textOf(await midMerge(), 'git commit -m x')).toBe(UNRESOLVED_COMMIT)
  })
})

describe('restoring an unmerged file', () => {
  it.each(['git restore story.md'])('refuses %s and leaves the markers', async (line) => {
    const sandbox = await midMerge()
    const before = await textOf(sandbox, 'cat story.md')

    expect(await textOf(sandbox, line)).toBe("error: path 'story.md' is unmerged")
    expect(await textOf(sandbox, 'cat story.md')).toBe(before)
    expect(await textOf(sandbox, 'git status -s')).toBe('UU story.md')
  })
})

describe('git status mid-merge once every resolution matches HEAD', () => {
  it('says the conflicts are fixed without claiming nothing is left to commit', async () => {
    const sandbox = await midMerge()
    await sandbox.run('echo "main" > story.md')
    await sandbox.run('git add story.md')

    expect(await textOf(sandbox, 'git status')).toBe(
      'On branch main\nAll conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)\n',
    )
  })
})
