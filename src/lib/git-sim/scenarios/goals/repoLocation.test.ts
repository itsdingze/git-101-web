import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { meets } from '@/lib/git-sim/goals/goalFixtures'

const STORY_FOLDER: SandboxSeed = {
  dir: 'my-story',
  setup: [{ write: { 'chapter-one.md': 'The lighthouse.\n', 'outline.md': 'Act one.\n' } }],
}

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
})
