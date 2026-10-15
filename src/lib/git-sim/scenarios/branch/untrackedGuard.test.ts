import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const NOTES_FILE_ON_FEAT: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.md': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feat' },
    { write: { notes: 'n\n' } },
    { run: 'git add notes' },
    { run: 'git commit -m "Add notes"' },
    { run: 'git switch main' },
  ],
}

const NOTES_FOLDER_ON_FEAT: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'a.md': 'a\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c feat' },
    { write: { 'notes/n.md': 'n\n' } },
    { run: 'git add notes' },
    { run: 'git commit -m "Add notes folder"' },
    { run: 'git switch main' },
  ],
}

const LOSE_FOLDER = ['error: Updating the following directories would lose untracked files in them:', '\tnotes', '', 'Aborting']

describe('untracked work in a folder where the other branch has a file', () => {
  async function withDraft(): Promise<Sandbox> {
    const sandbox = await createSandbox(NOTES_FILE_ON_FEAT)
    await sandbox.run('mkdir notes')
    await sandbox.run('echo "precious" > notes/draft.txt')
    return sandbox
  }

  it('refuses to switch and keeps the draft', async () => {
    const sandbox = await withDraft()

    expect(await textOf(sandbox, 'git switch feat')).toBe(LOSE_FOLDER.join('\n'))
    expect(await textOf(sandbox, 'cat notes/draft.txt')).toBe('precious')
    expect((await sandbox.snapshot()).branch).toBe('main')
  })

  it('refuses to merge and keeps the draft', async () => {
    const sandbox = await withDraft()

    const output = await textOf(sandbox, 'git merge feat')
    expect(output).toContain(LOSE_FOLDER.slice(0, 2).join('\n'))
    expect(output).toContain('Aborting')
    expect(await textOf(sandbox, 'cat notes/draft.txt')).toBe('precious')
    expect((await sandbox.snapshot()).headMessage).toBe('Initial commit')
  })
})

describe('an untracked file where the other branch has a folder', () => {
  async function withFile(): Promise<Sandbox> {
    const sandbox = await createSandbox(NOTES_FOLDER_ON_FEAT)
    await sandbox.run('echo "precious" > notes')
    return sandbox
  }

  it('refuses to switch and keeps the file', async () => {
    const sandbox = await withFile()

    expect(await textOf(sandbox, 'git switch feat')).toBe(
      [
        'error: The following untracked working tree files would be overwritten by checkout:',
        '\tnotes',
        'Please move or remove them before you switch branches.',
        'Aborting',
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'cat notes')).toBe('precious')
  })

  it('refuses to merge and keeps the file', async () => {
    const sandbox = await withFile()

    const output = await textOf(sandbox, 'git merge feat')
    expect(output).toContain('error: The following untracked working tree files would be overwritten by merge:\n\tnotes')
    expect(await textOf(sandbox, 'cat notes')).toBe('precious')
  })
})
