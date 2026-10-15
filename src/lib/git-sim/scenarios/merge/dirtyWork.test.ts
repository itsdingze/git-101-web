import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const BASE: SandboxSeed['setup'] = [
  { run: 'git init' },
  { write: { 'notes.md': 'notes\n', 'story.md': 'story\n' } },
  { run: 'git add .' },
  { run: 'git commit -m "Initial commit"' },
  { run: 'git switch -c feature' },
  { write: { 'story.md': 'story, continued\n' } },
  { run: 'git commit -am "Continue the story"' },
  { run: 'git switch main' },
]

const FAST_FORWARD_SEED: SandboxSeed = { dir: 'project', setup: BASE }

const DIVERGED_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    ...(BASE ?? []),
    { write: { 'title.md': 'title\n' } },
    { run: 'git add title.md' },
    { run: 'git commit -m "Add a title"' },
  ],
}

const CONFLICT_SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    ...(BASE ?? []),
    { write: { 'story.md': 'story, rewritten\n' } },
    { run: 'git commit -am "Rewrite the story"' },
  ],
}

const REMOTE_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [
      { write: { 'notes.md': 'notes\n', 'story.md': 'story\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [
      { write: { 'story.md': 'story, continued\n' } },
      { run: 'git commit -am "Continue the story"' },
    ],
  },
}

async function text(sandbox: Sandbox, line: string): Promise<string> {
  return (await sandbox.run(line)).outputs.map((output) => output.text).join('\n')
}

const OVERWRITE_REFUSAL = [
  'error: Your local changes to the following files would be overwritten by merge:',
  '\tstory.md',
  'Please commit your changes or stash them before you merge.',
  'Aborting',
].join('\n')

describe('merging with uncommitted edits', () => {
  it('keeps an unrelated unstaged edit through a fast-forward', async () => {
    const sandbox = await createSandbox(FAST_FORWARD_SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git merge feature')).toContain('Fast-forward')
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
    expect(await text(sandbox, 'cat story.md')).toBe('story, continued')
    expect((await sandbox.snapshot()).unstaged).toEqual([{ path: 'notes.md', kind: 'modified' }])
  })

  it('keeps an unrelated staged edit staged through a fast-forward', async () => {
    const sandbox = await createSandbox(FAST_FORWARD_SEED)
    await sandbox.run('echo "my notes" > notes.md')
    await sandbox.run('git add notes.md')

    expect(await text(sandbox, 'git merge feature')).toContain('Fast-forward')
    expect((await sandbox.snapshot()).staged).toEqual([{ path: 'notes.md', kind: 'modified' }])
  })

  it('keeps an unrelated unstaged edit through a true merge', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git merge feature')).toContain("Merge made by the 'ort' strategy.")
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
    const snapshot = await sandbox.snapshot()
    expect(snapshot.unstaged).toEqual([{ path: 'notes.md', kind: 'modified' }])
    expect(snapshot.headMessage).toBe("Merge branch 'feature'")
  })

  it('refuses a true merge while anything is staged, like merge-ort', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)
    await sandbox.run('echo "my notes" > notes.md')
    await sandbox.run('git add notes.md')

    expect(await text(sandbox, 'git merge feature')).toBe(
      [
        'error: Your local changes to the following files would be overwritten by merge:',
        '  notes.md',
        'Merge with strategy ort failed.',
      ].join('\n'),
    )
    const snapshot = await sandbox.snapshot()
    expect(snapshot.headMessage).toBe('Add a title')
    expect(snapshot.staged).toEqual([{ path: 'notes.md', kind: 'modified' }])
  })

  it('refuses a fast-forward that would overwrite an edited file, and changes nothing', async () => {
    const sandbox = await createSandbox(FAST_FORWARD_SEED)
    await sandbox.run('echo "my own story" > story.md')
    const before = (await sandbox.snapshot()).headMessage

    const output = await text(sandbox, 'git merge feature')
    expect(output).toMatch(/^Updating [0-9a-f]{7}\.\.[0-9a-f]{7}\n/)
    expect(output).toContain(OVERWRITE_REFUSAL)
    expect(await text(sandbox, 'cat story.md')).toBe('my own story')
    expect((await sandbox.snapshot()).headMessage).toBe(before)
  })

  it('refuses a true merge that would overwrite an unstaged edit', async () => {
    const sandbox = await createSandbox(DIVERGED_SEED)
    await sandbox.run('echo "my own story" > story.md')

    expect(await text(sandbox, 'git merge feature')).toBe(`${OVERWRITE_REFUSAL}\nMerge with strategy ort failed.`)
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
    expect((await sandbox.snapshot()).headMessage).toBe('Add a title')
    expect(await text(sandbox, 'cat story.md')).toBe('my own story')
  })

  it('refuses to overwrite an untracked file the other branch adds', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        ...(BASE ?? []),
        { run: 'git switch feature' },
        { write: { 'only.md': 'theirs\n' } },
        { run: 'git add only.md' },
        { run: 'git commit -m "Add only"' },
        { run: 'git switch main' },
      ],
    })
    await sandbox.run('echo "mine" > only.md')

    const output = await text(sandbox, 'git merge feature')
    expect(output).toContain(
      [
        'error: The following untracked working tree files would be overwritten by merge:',
        '\tonly.md',
        'Please move or remove them before you merge.',
        'Aborting',
      ].join('\n'),
    )
    expect(await text(sandbox, 'cat only.md')).toBe('mine')
  })

  it('keeps an unrelated edit while pausing at a conflict', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git merge feature')).toContain('CONFLICT (content): Merge conflict in story.md')
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
  })

  it('keeps an unrelated edit through merge --abort', async () => {
    const sandbox = await createSandbox(CONFLICT_SEED)
    await sandbox.run('echo "my notes" > notes.md')
    await sandbox.run('git merge feature')

    expect(await text(sandbox, 'git merge --abort')).toBe('')
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
    expect(await text(sandbox, 'cat story.md')).toBe('story, rewritten')
    expect((await sandbox.snapshot()).mergeInProgress).toBe(false)
  })

  it('keeps an unrelated edit through a pull, and refuses one that would be overwritten', async () => {
    const kept = await createSandbox(REMOTE_SEED)
    await kept.run('echo "my notes" > notes.md')
    expect(await text(kept, 'git pull')).toContain('Fast-forward')
    expect(await text(kept, 'cat notes.md')).toBe('my notes')

    const refused = await createSandbox(REMOTE_SEED)
    await refused.run('echo "my own story" > story.md')
    expect(await text(refused, 'git pull')).toContain(OVERWRITE_REFUSAL)
    expect(await text(refused, 'cat story.md')).toBe('my own story')
  })
})
