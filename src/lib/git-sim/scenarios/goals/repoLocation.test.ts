import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { meets } from '@/lib/git-sim/scenarios/goalFixtures'

const STORY_FOLDER: SandboxSeed = {
  dir: 'my-story',
  setup: [{ write: { 'chapter-one.md': 'The lighthouse.\n', 'outline.md': 'Act one.\n' } }],
}

describe('nested-repository goals', () => {
  const WITH_NOTES: SandboxSeed = { dir: 'todo-app', setup: [{ write: { 'notes/ideas.txt': 'Add search\n' } }] }

  it('pass once git init runs inside a folder of the project', async () => {
    const sandbox = await createSandbox(WITH_NOTES)
    expect(await meets(sandbox, { kind: 'nested-repository' })).toBe(false)

    await sandbox.run('cd notes')
    await sandbox.run('git init')

    expect(await meets(sandbox, { kind: 'nested-repository' })).toBe(true)
  })

  it('stay false for the project repository itself, and clear once the stray one is removed', async () => {
    const sandbox = await createSandbox(WITH_NOTES)
    await sandbox.run('git init')
    expect(await meets(sandbox, { kind: 'nested-repository' })).toBe(false)

    await sandbox.run('cd notes')
    await sandbox.run('git init')
    await sandbox.run('rm -r .git')

    expect(await meets(sandbox, { kind: 'nested-repository' })).toBe(false)
  })
})

describe('where the repository lives', () => {
  it('counts a repository created inside the project folder', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)
    await sandbox.run('git init')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.repoLocation).toBe('project')
    expect(await meets(sandbox, { kind: 'repo-initialized' })).toBe(true)
    expect(await meets(sandbox, { kind: 'repo-above-project' })).toBe(false)
  })

  it('does not count a repository created in a folder above the project', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)
    await sandbox.run('cd ..')
    await sandbox.run('git init')

    const snapshot = await sandbox.snapshot()
    expect(snapshot.repoLocation).toBe('above')
    expect(await meets(sandbox, { kind: 'repo-initialized' })).toBe(false)
    expect(await meets(sandbox, { kind: 'repo-above-project' })).toBe(true)
  })

  it('reports no repository at all before git init', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)

    expect((await sandbox.snapshot()).repoLocation).toBeNull()
    expect(await meets(sandbox, { kind: 'repo-above-project' })).toBe(false)
  })

  it('counts the project repository once it exists, even with another one above', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)
    await sandbox.run('cd ..')
    await sandbox.run('git init')
    await sandbox.run('cd my-story')
    await sandbox.run('git init')

    expect((await sandbox.snapshot()).repoLocation).toBe('project')
    expect(await meets(sandbox, { kind: 'repo-initialized' })).toBe(true)
  })

  it('still sees the repository above once the project has its own', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)
    await sandbox.run('cd ..')
    await sandbox.run('git init')
    await sandbox.run('cd my-story')
    await sandbox.run('git init')

    expect(await meets(sandbox, { kind: 'repo-above-project' })).toBe(true)
  })

  it('clears once the repository above is removed', async () => {
    const sandbox = await createSandbox(STORY_FOLDER)
    await sandbox.run('cd ..')
    await sandbox.run('git init')
    await sandbox.run('rm -rf .git')
    await sandbox.run('cd my-story')
    await sandbox.run('git init')

    expect(await meets(sandbox, { kind: 'repo-above-project' })).toBe(false)
  })
})
