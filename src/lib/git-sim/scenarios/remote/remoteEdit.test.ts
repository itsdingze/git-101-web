import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('fixing a mistyped remote address', () => {
  it('lets set-url point origin at the right repository so the push works', async () => {
    const url = 'https://github.com/you/garden-notes.git'
    const sandbox = await createSandbox({
      dir: 'garden-notes',
      remote: { name: 'origin', url, cloned: false },
      setup: [
        { run: 'git init' },
        { write: { 'tomatoes.md': '# Tomatoes\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Start the garden notes"' },
      ],
    })
    await sandbox.run('git remote add origin https://github.com/you/garden-note.git')
    expect(await textOf(sandbox, 'git push -u origin main')).toContain('Repository not found')

    await sandbox.run(`git remote set-url origin ${url}`)

    expect(await textOf(sandbox, 'git push -u origin main')).toContain("branch 'main' set up to track 'origin/main'.")
  })
})

describe('changing a remote', () => {
  it('refuses to add a remote name twice', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git remote add origin https://github.com/a/x.git')

    expect(await textOf(sandbox, 'git remote add origin https://github.com/a/y.git')).toBe(
      'error: remote origin already exists.',
    )
    expect(await textOf(sandbox, 'git remote -v')).toContain('https://github.com/a/x.git')
  })

  it('changes the address with set-url', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.run('git remote add origin https://github.com/a/x.git')

    expect(await textOf(sandbox, 'git remote set-url origin https://github.com/a/y.git')).toBe('')
    expect(await textOf(sandbox, 'git remote -v')).toBe(
      'origin\thttps://github.com/a/y.git (fetch)\norigin\thttps://github.com/a/y.git (push)',
    )
  })

  it('names a missing remote like real git', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git remote set-url nope https://z')).toBe("error: No such remote 'nope'")
    expect(await textOf(sandbox, 'git remote remove nope')).toBe("error: No such remote: 'nope'")
    expect(await textOf(sandbox, 'git remote set-url origin')).toMatch(
      /^usage: git remote set-url \[--push\] <name> <newurl> \[<oldurl>\]/,
    )
  })
})
