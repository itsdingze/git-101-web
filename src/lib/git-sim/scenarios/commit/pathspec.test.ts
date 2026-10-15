import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'notes.md': 'notes\n', 'story.md': 'story\n', 'docs/a.md': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

async function text(sandbox: Sandbox, line: string): Promise<string> {
  return (await sandbox.run(line)).outputs.map((output) => output.text).join('\n')
}

describe('git commit with paths', () => {
  it('commits only the named file, and leaves other staged work staged', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "n2" > notes.md')
    await sandbox.run('echo "s2" > story.md')
    await sandbox.run('git add story.md')

    expect(await text(sandbox, 'git commit -m "Only notes" notes.md')).toMatch(/^\[main [0-9a-f]{7}\] Only notes\n 1 file changed/)
    const snapshot = await sandbox.snapshot()
    expect(snapshot.commits.find((commit) => commit.message === 'Only notes')?.modified).toEqual(['notes.md'])
    expect(snapshot.staged).toEqual([{ path: 'story.md', kind: 'modified' }])
    expect(snapshot.unstaged).toEqual([])
  })

  it('accepts a folder and a dot', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "a2" > docs/a.md')
    expect(await text(sandbox, 'git commit -m "Docs" docs')).toMatch(/^\[main [0-9a-f]{7}\] Docs/)

    await sandbox.run('echo "n2" > notes.md')
    expect(await text(sandbox, 'git commit -m "Everything" .')).toMatch(/^\[main [0-9a-f]{7}\] Everything/)
    expect((await sandbox.snapshot()).unstaged).toEqual([])
  })

  it('still refuses a path Git does not know', async () => {
    const sandbox = await createSandbox(SEED)
    expect(await text(sandbox, 'git commit -m x missing.md')).toBe(
      "error: pathspec 'missing.md' did not match any file(s) known to git",
    )
  })

  it('refuses paths together with -a', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "n2" > notes.md')
    expect(await text(sandbox, 'git commit -am x notes.md')).toBe("fatal: paths 'notes.md ...' with -a does not make sense")
  })
})

const CONFLICT_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'story.md': 'story\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'story.md': 'story, theirs\n' } },
    { run: 'git commit -am "Theirs"' },
    { run: 'git switch main' },
    { write: { 'story.md': 'story, ours\n' } },
    { run: 'git commit -am "Ours"' },
  ],
}

async function midMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(CONFLICT_SEED)
  await sandbox.run('git merge feature')
  return sandbox
}

describe('finishing a conflicted merge', () => {
  it('refuses a partial commit during a merge', async () => {
    const sandbox = await midMerge()
    await sandbox.run('echo "resolved" > story.md')
    await sandbox.run('git add story.md')
    expect(await text(sandbox, 'git commit -m x story.md')).toBe('fatal: cannot do a partial commit during a merge.')
  })

  it('concludes with the default message on commit --no-edit', async () => {
    const sandbox = await midMerge()
    await sandbox.run('echo "resolved" > story.md')
    await sandbox.run('git add story.md')

    expect(await text(sandbox, 'git commit --no-edit')).toMatch(/^\[main [0-9a-f]{7}\] Merge branch 'feature'$/)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('concludes on merge --continue once everything is resolved', async () => {
    const sandbox = await midMerge()
    expect(await text(sandbox, 'git merge --continue')).toContain(
      'error: Committing is not possible because you have unmerged files.',
    )

    await sandbox.run('echo "resolved" > story.md')
    await sandbox.run('git add story.md')
    expect(await text(sandbox, 'git merge --continue')).toMatch(/^\[main [0-9a-f]{7}\] Merge branch 'feature'$/)
    expect((await sandbox.snapshot()).headMessage).toBe("Merge branch 'feature'")
  })

  it('says there is no merge to continue outside a merge', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    expect(await text(sandbox, 'git merge --continue')).toBe('fatal: There is no merge in progress (MERGE_HEAD missing).')
  })
})

describe('merge commit titles', () => {
  const DIVERGED: SandboxSeed = {
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'story.md': 'story\n', 'notes.md': 'notes\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
      { run: 'git switch -c feature' },
      { write: { 'story.md': 'story, theirs\n' } },
      { run: 'git commit -am "Theirs"' },
      { run: 'git switch main' },
      { write: { 'notes.md': 'notes, ours\n' } },
      { run: 'git commit -am "Ours"' },
    ],
  }

  it('leaves out "into main"', async () => {
    const sandbox = await createSandbox(DIVERGED)
    await sandbox.run('git merge feature')
    expect((await sandbox.snapshot()).headMessage).toBe("Merge branch 'feature'")
  })

  it('names any other receiving branch', async () => {
    const sandbox = await createSandbox(DIVERGED)
    await sandbox.run('git switch -c topic')
    await sandbox.run('git merge feature')
    expect((await sandbox.snapshot()).headMessage).toBe("Merge branch 'feature' into topic")
  })

  it('calls a revision a commit', async () => {
    const sandbox = await createSandbox(DIVERGED)
    await sandbox.run('git merge feature~0')
    expect((await sandbox.snapshot()).headMessage).toBe("Merge commit 'feature~0'")
  })
})
