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
  },
}

const HASH_RANGE = '[0-9a-f]{7}\\.\\.\\.[0-9a-f]{7}'

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

describe('pushing when the remote already has everything', () => {
  it('says everything is up to date, after re-pairing the branch with -u', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git switch -c feature')
    await sandbox.run('echo "draft" > notes.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add notes"')
    await sandbox.run('git push -u origin feature')

    expect(await textOf(sandbox, 'git push -u origin feature')).toBe(
      "branch 'feature' set up to track 'origin/feature'.\nEverything up-to-date",
    )
    expect(await textOf(sandbox, 'git push')).toBe('Everything up-to-date')
  })
})

describe('pushing a new branch to GitHub', () => {
  it('prints the link GitHub offers for opening a pull request', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git switch -c add-export')
    await sandbox.run('echo "export" > export.txt')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "feat: add export"')

    const output = await textOf(sandbox, 'git push -u origin add-export')

    expect(output).toContain(
      [
        'remote: ',
        "remote: Create a pull request for 'add-export' on GitHub by visiting:",
        'remote:      https://github.com/team/project/pull/new/add-export',
        'remote: ',
        'To https://github.com/team/project.git',
        ' * [new branch]      add-export -> add-export',
      ].join('\n'),
    )
  })

  it('offers no link for main', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('echo "notes" > notes.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add notes"')

    expect(await textOf(sandbox, 'git push')).not.toContain('Create a pull request')
  })
})

describe('the transfer lines of a push', () => {
  it('count every object on the first push to an empty repository', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      remote: { name: 'origin', url: REMOTE_URL, cloned: false },
      setup: [
        { run: 'git init' },
        { write: { 'README.md': '# Project\n', 'app.txt': 'run()\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Initial commit"' },
        { write: { 'app.txt': 'run()\nstop()\n' } },
        { run: 'git add .' },
        { run: 'git commit -m "Add stop"' },
      ],
    })
    await sandbox.run(`git remote add origin ${REMOTE_URL}`)

    const output = await textOf(sandbox, 'git push -u origin main')

    expect(output).toContain('Enumerating objects: 7, done.')
    expect(output).toContain('Counting objects: 100% (7/7), done.')
    expect(output).toContain('Writing objects: 100% (7/7), done.')
  })

  it('count only the new objects when the remote already has the rest', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('echo "notes" > notes.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add notes"')

    const output = await textOf(sandbox, 'git push')

    expect(output).toContain('Enumerating objects: 5, done.')
    expect(output).toContain('Writing objects: 100% (3/3), done.')
  })
})
