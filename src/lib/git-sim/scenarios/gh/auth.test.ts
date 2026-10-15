import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { NO_LOCKS } from '@/lib/git-sim/input/commandLocks'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [{ write: { '~/token.txt': 'ghp_practicetoken123\n', '~/wrong.txt': 'hunter2\n' } }],
}

const NOT_SIGNED_IN = 'You are not logged into any GitHub hosts. To log in, run: gh auth login'

const SIGNED_IN_STATUS = [
  'github.com',
  '  ✓ Logged in to github.com account your-username (keyring)',
  '  - Active account: true',
  '  - Git operations protocol: https',
  '  - Token: ghp_****************',
  "  - Token scopes: 'gist', 'read:org', 'repo'",
].join('\n')

function learnerSandbox(seed: SandboxSeed = SEED): Promise<Sandbox> {
  return createSandbox(seed, NO_LOCKS, 'navigation-only')
}

describe('gh auth status', () => {
  it('says nobody is signed in yet, on stderr', async () => {
    const sandbox = await learnerSandbox()

    expect((await sandbox.run('gh auth status')).outputs).toEqual([{ stream: 'stderr', text: NOT_SIGNED_IN }])
  })

  it('shows the account and the protocol Git uses once signed in', async () => {
    const sandbox = await learnerSandbox()
    await sandbox.run('gh auth login --with-token < ~/token.txt')

    expect((await sandbox.run('gh auth status')).outputs).toEqual([{ stream: 'stdout', text: SIGNED_IN_STATUS }])
  })
})

describe('gh auth login --with-token', () => {
  it('signs in silently with a token read through <', async () => {
    const sandbox = await learnerSandbox()

    expect((await sandbox.run('gh auth login --with-token < ~/token.txt')).outputs).toEqual([])
    expect(evaluateGoal({ kind: 'gh-authenticated' }, await sandbox.snapshot())).toBe(true)
  })

  it('refuses a token GitHub would not accept', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'gh auth login --with-token < ~/wrong.txt')).toBe(
      'error validating token: HTTP 401: Bad credentials (https://api.github.com/)',
    )
    expect(evaluateGoal({ kind: 'gh-authenticated' }, await sandbox.snapshot())).toBe(false)
  })

  it('explains how to give it the token when nothing is read in', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'gh auth login --with-token')).toBe(
      "This practice terminal can't wait for you to paste a token. Read it from the file instead: gh auth login --with-token < ~/token.txt",
    )
  })
})

describe('gh auth login without a token', () => {
  it('explains that the browser sign-in is for your own computer', async () => {
    const sandbox = await learnerSandbox()

    expect(await textOf(sandbox, 'gh auth login')).toBe(
      "This practice terminal can't open a browser to sign you in. Sign in with the practice token instead: gh auth login --with-token < ~/token.txt",
    )
  })
})

describe('a seed that starts signed in', () => {
  it('meets gh-authenticated before anything is typed, even outside a repository', async () => {
    const sandbox = await learnerSandbox({ dir: '', github: { signedIn: true } })

    expect(evaluateGoal({ kind: 'gh-authenticated' }, await sandbox.snapshot())).toBe(true)
    expect(await textOf(sandbox, 'gh auth status')).toContain('Logged in to github.com account your-username')
  })
})

describe('gh commands other than auth', () => {
  it('ask you to sign in first', async () => {
    const sandbox = await learnerSandbox()

    expect((await sandbox.run('gh pr view')).outputs).toEqual([
      {
        stream: 'stderr',
        text: [
          'To get started with GitHub CLI, please run:  gh auth login',
          'Alternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token.',
        ].join('\n'),
      },
    ])
  })
})
