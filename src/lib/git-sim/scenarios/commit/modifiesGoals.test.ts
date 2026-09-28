import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED, meets } from '@/lib/git-sim/goals/goalFixtures'

describe('commit-exists with modifies', () => {
  it('matches a commit that changed a file the previous commit already had', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    const editsIndex = { kind: 'commit-exists', modifies: ['index.html'] } as const
    expect(await meets(sandbox, editsIndex)).toBe(false)

    await sandbox.run('echo "<h1>Changed</h1>" > index.html')
    await sandbox.run('git commit -am "Change the heading"')

    expect(await meets(sandbox, editsIndex)).toBe(true)
    expect(await meets(sandbox, { kind: 'commit-exists', modifies: ['style.css'] })).toBe(false)
  })

  it('does not count a commit that only adds the file', async () => {
    const sandbox = await createSandbox({ dir: 'my-project', setup: [{ run: 'git init' }, { write: { 'a.md': 'a\n' } }] })
    await sandbox.run('git add a.md')
    await sandbox.run('git commit -m "Add a"')

    expect(await meets(sandbox, { kind: 'commit-exists', modifies: ['a.md'] })).toBe(false)
  })

  it('needs every listed file changed in the same commit', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('echo "one" > index.html')
    await sandbox.run('git commit -am "One"')
    await sandbox.run('echo "two" > style.css')
    await sandbox.run('git commit -am "Two"')

    expect(await meets(sandbox, { kind: 'commit-exists', modifies: ['index.html', 'style.css'] })).toBe(false)

    await sandbox.run('echo "three" > index.html')
    await sandbox.run('echo "four" > style.css')
    await sandbox.run('git commit -am "Both"')
    expect(await meets(sandbox, { kind: 'commit-exists', modifies: ['index.html', 'style.css'] })).toBe(true)
  })
})
