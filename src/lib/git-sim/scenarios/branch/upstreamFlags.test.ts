import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const URL = 'https://github.com/team/project.git'

const SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: URL,
    setup: [
      { write: { 'f.txt': 'one\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
      { run: 'git branch other' },
    ],
  },
}

async function onPushedFeature(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -c feat')
  await sandbox.run('git push origin feat')
  return sandbox
}

describe('git branch --set-upstream-to', () => {
  it('sets the upstream of a named branch', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch --set-upstream-to=origin/feat feat')).toBe(
      "branch 'feat' set up to track 'origin/feat'.",
    )
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/feat'.")
  })

  it('sets the upstream of the current branch with -u', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch -u origin/feat')).toBe("branch 'feat' set up to track 'origin/feat'.")
  })

  it('never creates a branch from the upstream name', async () => {
    const sandbox = await onPushedFeature()

    await sandbox.run('git branch -u origin/feat')

    expect(await textOf(sandbox, 'git branch')).toBe('* feat\n  main')
  })

  it('accepts a local branch as the upstream', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch -u main')).toBe("branch 'feat' set up to track 'main'.")
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'main'.")
  })

  it('refuses a missing upstream', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch -u origin/nope')).toContain(
      "fatal: the requested upstream branch 'origin/nope' does not exist",
    )
  })

  it('refuses a missing branch', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch -u origin/feat nosuch')).toBe("fatal: branch 'nosuch' does not exist")
  })
})

describe('git branch --unset-upstream', () => {
  it('removes the upstream', async () => {
    const sandbox = await onPushedFeature()
    await sandbox.run('git branch -u origin/feat')

    expect(await textOf(sandbox, 'git branch --unset-upstream')).toBe('')

    expect(await textOf(sandbox, 'git status')).not.toContain('origin/feat')
  })

  it('refuses when there is no upstream', async () => {
    const sandbox = await onPushedFeature()

    expect(await textOf(sandbox, 'git branch --unset-upstream')).toBe("fatal: branch 'feat' has no upstream information")
  })
})

describe('a branch started from a remote branch', () => {
  it('tracks it with git switch -c', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch -c y origin/other')).toBe(
      "branch 'y' set up to track 'origin/other'.\nSwitched to a new branch 'y'",
    )
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/other'.")
  })

  it('tracks it with git branch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch z origin/other')).toBe("branch 'z' set up to track 'origin/other'.")
  })

  it('sets no tracking for a local start point', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git branch z main')).toBe('')
    await sandbox.run('git switch z')

    expect(await textOf(sandbox, 'git status')).not.toContain('origin')
  })
})

describe('git switch to a branch that only exists on the remote', () => {
  it('creates a tracking branch', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch other')).toBe(
      "branch 'other' set up to track 'origin/other'.\nSwitched to a new branch 'other'",
    )
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/other'.")
  })

  it('still refuses a name found nowhere', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git switch nosuch')).toBe('fatal: invalid reference: nosuch')
  })
})

describe('git branch -d with an upstream', () => {
  async function branchAheadOfHead(): Promise<Sandbox> {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c a')
    await sandbox.writeFile('f.txt', 'one\ntwo\n')
    await sandbox.run('git commit -am a')
    await sandbox.run('git push -u origin a')
    await sandbox.run('git switch main')
    return sandbox
  }

  it('deletes with a warning when merged to the upstream only', async () => {
    const sandbox = await branchAheadOfHead()

    const result = await sandbox.run('git branch -d a')

    expect(result.outputs.every((output) => output.stream === 'stdout')).toBe(true)
    expect(result.outputs.map((output) => output.text).join('\n')).toMatch(
      /^warning: deleting branch 'a' that has been merged to\n {9}'refs\/remotes\/origin\/a', but not yet merged to HEAD\nDeleted branch a \(was [0-9a-f]{7}\)\.$/,
    )
  })

  it('keeps a branch merged to HEAD but not its upstream', async () => {
    const sandbox = await branchAheadOfHead()
    await sandbox.run('git switch a')
    await sandbox.writeFile('f.txt', 'one\ntwo\nthree\n')
    await sandbox.run('git commit -am b')
    await sandbox.run('git switch main')
    await sandbox.run('git merge a')

    const result = await sandbox.run('git branch -d a')

    expect(result.outputs.some((output) => output.stream === 'stderr')).toBe(true)
    expect(result.outputs.map((output) => output.text).join('\n')).toBe(
      [
        "warning: not deleting branch 'a' that is not yet merged to",
        "         'refs/remotes/origin/a', even though it is merged to HEAD",
        "error: The branch 'a' is not fully merged.",
        "If you are sure you want to delete it, run 'git branch -D a'.",
      ].join('\n'),
    )
  })

  it('deletes without a warning when merged to both', async () => {
    const sandbox = await branchAheadOfHead()
    await sandbox.run('git merge a')

    expect(await textOf(sandbox, 'git branch -d a')).toMatch(/^Deleted branch a \(was [0-9a-f]{7}\)\.$/)
  })
})
