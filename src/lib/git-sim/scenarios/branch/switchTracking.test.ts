import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const CLONED: SandboxSeed = {
  dir: 'work',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/work.git',
    setup: [{ write: { a: 'a\n' } }, { run: 'git add a' }, { run: 'git commit -m c1' }],
  },
  setup: [{ run: 'git switch -c topic' }],
}

describe('git switch to a branch with an upstream', () => {
  it('reports that the branch is up to date', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await textOf(sandbox, 'git switch main')).toBe(
      "Switched to branch 'main'\nYour branch is up to date with 'origin/main'.",
    )
  })

  it('reports commits not yet pushed', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('git switch main')
    await sandbox.run('git commit --allow-empty -m c2')
    await sandbox.run('git switch topic')
    expect(await textOf(sandbox, 'git switch -')).toBe(
      [
        "Switched to branch 'main'",
        "Your branch is ahead of 'origin/main' by 1 commit.",
        '  (use "git push" to publish your local commits)',
      ].join('\n'),
    )
  })

  it('reports it when already on the branch', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('git switch main')
    expect(await textOf(sandbox, 'git switch main')).toBe(
      "Already on 'main'\nYour branch is up to date with 'origin/main'.",
    )
  })

  it('puts the report after the carried changes', async () => {
    const sandbox = await createSandbox(CLONED)
    await sandbox.run('echo "dirty" > a')
    expect(await textOf(sandbox, 'git switch main')).toBe(
      "M\ta\nSwitched to branch 'main'\nYour branch is up to date with 'origin/main'.",
    )
  })

  it('stays silent with -q', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await textOf(sandbox, 'git switch -q main')).toBe('')
  })

  it('reports nothing for a branch without an upstream', async () => {
    const sandbox = await createSandbox(CLONED)
    expect(await textOf(sandbox, 'git switch -c other')).toBe("Switched to a new branch 'other'")
    expect(await textOf(sandbox, 'git switch topic')).toBe("Switched to branch 'topic'")
  })
})
