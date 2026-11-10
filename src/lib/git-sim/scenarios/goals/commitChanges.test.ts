import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/scenarios/goalFixtures'

describe('commit-exists changes', () => {
  async function withReadmeThenStyle() {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "# Hello" > README.md')
    await sandbox.run('git add README.md')
    await sandbox.run('git commit -m "docs: add a README"')
    await sandbox.run('echo "h1 { color: red; }" >> style.css')
    await sandbox.run('git add style.css')
    await sandbox.run('git commit -m "fix: colour the heading"')
    return sandbox
  }

  it('counts a file the commit added', async () => {
    const sandbox = await withReadmeThenStyle()

    expect(await meets(sandbox, { kind: 'commit-exists', changes: ['README.md'], messageIncludes: 'docs:' })).toBe(true)
  })

  it('counts a file the commit edited', async () => {
    const sandbox = await withReadmeThenStyle()

    expect(await meets(sandbox, { kind: 'commit-exists', changes: ['style.css'], messageIncludes: 'fix:' })).toBe(true)
  })

  it('ignores a file only carried over from an earlier commit', async () => {
    const sandbox = await withReadmeThenStyle()

    expect(await meets(sandbox, { kind: 'commit-exists', changes: ['README.md'], messageIncludes: 'fix:' })).toBe(false)
    expect(await meets(sandbox, { kind: 'commit-exists', changes: ['README.md', 'style.css'] })).toBe(false)
  })

  it('finds nothing in a root commit, which has no parent to compare against', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await meets(sandbox, { kind: 'commit-exists', changes: ['style.css'], messageIncludes: 'Initial' })).toBe(false)
  })
})
