import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'notes.md': 'notes\n', 'story.md': 'story\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feature' },
    { write: { 'story.md': 'story, continued\n', 'only.md': 'only on feature\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Continue the story"' },
    { run: 'git switch main' },
  ],
}

async function text(sandbox: Sandbox, line: string): Promise<string> {
  return (await sandbox.run(line)).outputs.map((output) => output.text).join('\n')
}

describe('switching branches with uncommitted work', () => {
  it('carries a staged new file across, and lists it like git does', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "nav" > navbar.md')
    await sandbox.run('git add navbar.md')

    expect(await text(sandbox, 'git switch feature')).toBe("A\tnavbar.md\nSwitched to branch 'feature'")
    expect((await sandbox.snapshot()).staged).toEqual([{ path: 'navbar.md', kind: 'new' }])

    expect(await text(sandbox, 'git switch main')).toBe("A\tnavbar.md\nSwitched to branch 'main'")
    expect(await text(sandbox, 'cat navbar.md')).toBe('nav')
  })

  it('carries an unstaged edit to a file both branches share unchanged', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git switch feature')).toBe("M\tnotes.md\nSwitched to branch 'feature'")
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
    expect(await text(sandbox, 'cat story.md')).toBe('story, continued')
  })

  it('refuses when the switch would overwrite an edit', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "my own story" > story.md')

    expect(await text(sandbox, 'git switch feature')).toBe(
      [
        'error: Your local changes to the following files would be overwritten by checkout:',
        '\tstory.md',
        'Please commit your changes or stash them before you switch branches.',
        'Aborting',
      ].join('\n'),
    )
    expect((await sandbox.snapshot()).branch).toBe('main')
    expect(await text(sandbox, 'cat story.md')).toBe('my own story')
  })

  it('refuses when the switch would overwrite an untracked file', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "mine" > only.md')

    expect(await text(sandbox, 'git switch feature')).toBe(
      [
        'error: The following untracked working tree files would be overwritten by checkout:',
        '\tonly.md',
        'Please move or remove them before you switch branches.',
        'Aborting',
      ].join('\n'),
    )
    expect(await text(sandbox, 'cat only.md')).toBe('mine')
  })

  it('carries work onto a branch created from another start point', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git switch -c side feature')).toBe("M\tnotes.md\nSwitched to a new branch 'side'")
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
    expect(await text(sandbox, 'cat story.md')).toBe('story, continued')
  })

  it('lists nothing when a new branch starts where you already are', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "my notes" > notes.md')

    expect(await text(sandbox, 'git switch -c side')).toBe("Switched to a new branch 'side'")
    expect(await text(sandbox, 'cat notes.md')).toBe('my notes')
  })

  it('switches when a staged edit already matches the target branch', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "story, continued" > story.md')
    await sandbox.run('git add story.md')

    expect(await text(sandbox, 'git switch feature')).toBe("Switched to branch 'feature'")
    expect(await text(sandbox, 'git status -s')).toBe('')
    expect(await text(sandbox, 'cat story.md')).toBe('story, continued')
  })
})

describe('switching to the branch you are already on', () => {
  it('lists the uncommitted work like real git', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [{ run: 'git init' }, { write: { 'a.txt': 'a\n' } }, { run: 'git add .' }, { run: 'git commit -m "init"' }],
    })
    await sandbox.run('echo "b" > a.txt')
    await sandbox.run('echo "n" > new.txt')
    await sandbox.run('git add new.txt')

    expect(await text(sandbox, 'git switch main')).toBe("M\ta.txt\nA\tnew.txt\nAlready on 'main'")
  })
})
