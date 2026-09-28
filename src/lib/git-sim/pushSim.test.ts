import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

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
  },
}

const HASH_RANGE = '[0-9a-f]{7}\\.\\.\\.[0-9a-f]{7}'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function amendedAfterPush(): Promise<Sandbox> {
  const sandbox = await createSandbox(TEAM_SEED)
  await sandbox.run('git switch -c feature')
  await sandbox.run('echo "draft" > notes.md')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m "Add notse"')
  await sandbox.run('git push -u origin feature')
  await sandbox.run('git commit --amend -m "Add notes"')
  return sandbox
}

async function teammatePushedTo(sandbox: Sandbox, branch: string): Promise<void> {
  await sandbox.run('cd ~')
  await sandbox.run(`git clone ${REMOTE_URL} teammate`)
  await sandbox.run('cd teammate')
  await sandbox.run(`git switch -c ${branch} origin/${branch}`)
  await sandbox.run('echo "review" > review.md')
  await sandbox.run('git add .')
  await sandbox.run('git commit -m "Leave a review note"')
  await sandbox.run(`git push origin ${branch}`)
  await sandbox.run('cd ~/project')
}

describe('pushing a rewritten commit', () => {
  it('is rejected as a non-fast-forward when the remote tip is already known', async () => {
    const sandbox = await amendedAfterPush()

    expect(await textOf(sandbox, 'git push')).toBe(
      [
        `To ${REMOTE_URL}`,
        ' ! [rejected]        feature -> feature (non-fast-forward)',
        `error: failed to push some refs to '${REMOTE_URL}'`,
        'hint: Updates were rejected because the tip of your current branch is behind',
        'hint: its remote counterpart. If you want to integrate the remote changes,',
        "hint: use 'git pull' before pushing again.",
        "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
      ].join('\n'),
    )
  })

  it('goes through with --force and reports a forced update', async () => {
    const sandbox = await amendedAfterPush()

    expect(await textOf(sandbox, 'git push --force')).toMatch(
      new RegExp(`\\n \\+ ${HASH_RANGE} feature -> feature \\(forced update\\)$`),
    )
    expect(await textOf(sandbox, 'git status')).toContain(
      "Your branch is up to date with 'origin/feature'.",
    )
  })

  it('treats -f as --force', async () => {
    const sandbox = await amendedAfterPush()

    expect(await textOf(sandbox, 'git push -f origin feature')).toContain('(forced update)')
  })

  it('goes through with --force-with-lease when nobody else has pushed', async () => {
    const sandbox = await amendedAfterPush()

    expect(await textOf(sandbox, 'git push --force-with-lease')).toContain('(forced update)')
  })

  it('refuses --force-with-lease when the remote moved since the last fetch', async () => {
    const sandbox = await amendedAfterPush()
    await teammatePushedTo(sandbox, 'feature')

    expect(await textOf(sandbox, 'git push --force-with-lease')).toBe(
      [
        `To ${REMOTE_URL}`,
        ' ! [rejected]        feature -> feature (stale info)',
        `error: failed to push some refs to '${REMOTE_URL}'`,
      ].join('\n'),
    )
  })
})

describe('pushing behind a remote that moved', () => {
  it('asks you to fetch first when the remote holds commits you have never seen', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await teammatePushedTo(sandbox, 'main')
    await sandbox.run('echo "mine" > mine.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add mine"')

    expect(await textOf(sandbox, 'git push')).toBe(
      [
        `To ${REMOTE_URL}`,
        ' ! [rejected]        main -> main (fetch first)',
        `error: failed to push some refs to '${REMOTE_URL}'`,
        'hint: Updates were rejected because the remote contains work that you do not',
        'hint: have locally. This is usually caused by another repository pushing to',
        'hint: the same ref. If you want to integrate the remote changes, use',
        "hint: 'git pull' before pushing again.",
        "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
      ].join('\n'),
    )
  })
})
