import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const REMOTE_URL = 'https://github.com/team/project.git'

const TEAM_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [
      { write: { 'CONTRIBUTING.md': '# How to help\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Add contributing guide"' },
    ],
  },
}

const SOLO_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: `git remote add origin ${REMOTE_URL}` },
  ],
}

async function featureBranchSandbox(): Promise<Sandbox> {
  const sandbox = await createSandbox(TEAM_SEED)
  await sandbox.run('git switch -c feature')
  await sandbox.run('echo "draft" > notes.md')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m "Add notes"')
  return sandbox
}

describe('a branch with no upstream', () => {
  it('reports no tracking in git status after a push without -u', async () => {
    const sandbox = await createSandbox(SOLO_SEED)
    await sandbox.run('git push origin main')

    expect(await textOf(sandbox, 'git status')).toBe(
      ['On branch main', 'nothing to commit, working tree clean'].join('\n'),
    )
  })

  it('refuses a bare git push and names the command that sets the upstream', async () => {
    const sandbox = await featureBranchSandbox()

    expect(await textOf(sandbox, 'git push')).toBe(
      [
        'fatal: The current branch feature has no upstream branch.',
        'To push the current branch and set the remote as upstream, use',
        '',
        '    git push --set-upstream origin feature',
        '',
        "To have this happen automatically for branches without a tracking",
        "upstream, see 'push.autoSetupRemote' in 'git help config'.",
      ].join('\n'),
    )
  })

  it('refuses a bare git pull and explains how to name the branch', async () => {
    const sandbox = await featureBranchSandbox()

    expect(await textOf(sandbox, 'git pull')).toBe(
      [
        'There is no tracking information for the current branch.',
        'Please specify which branch you want to merge with.',
        'See git-pull(1) for details.',
        '',
        '    git pull <remote> <branch>',
        '',
        'If you wish to set tracking information for this branch you can do so with:',
        '',
        '    git branch --set-upstream-to=origin/<branch> feature',
      ].join('\n'),
    )
  })
})

describe('a branch with an upstream', () => {
  it('reports tracking in git status once pushed with -u', async () => {
    const sandbox = await createSandbox(SOLO_SEED)
    await sandbox.run('git push -u origin main')

    expect(await textOf(sandbox, 'git status')).toContain(
      "Your branch is up to date with 'origin/main'.",
    )
  })

  it('pushes bare once -u has paired the branch', async () => {
    const sandbox = await featureBranchSandbox()
    await sandbox.run('git push -u origin feature')
    await sandbox.run('echo "more" >> notes.md')
    await sandbox.run('git commit -am "Extend notes"')

    const pushed = await textOf(sandbox, 'git push')
    expect(pushed).toMatch(/ {3}[0-9a-f]{7}\.\.[0-9a-f]{7} {2}feature -> feature/)
    expect(await textOf(sandbox, 'git status')).toContain(
      "Your branch is up to date with 'origin/feature'.",
    )
  })

  it('pulls bare on a branch the clone paired with the remote', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    expect(await textOf(sandbox, 'git pull')).toContain('Fast-forward')
    expect(await textOf(sandbox, 'ls')).toBe('CONTRIBUTING.md  README.md')
  })
})
