import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const REMOTE_URL = 'https://github.com/team/project.git'

const TEAM_SEED: SandboxSeed = {
  dir: 'my-clone',
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    setup: [
      { write: { 'README.md': '# Project\n', 'index.html': '<h1>Team project</h1>\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
  },
}

const TWO_BRANCH_SEED: SandboxSeed = {
  dir: 'my-clone',
  remote: {
    name: 'origin',
    url: REMOTE_URL,
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
      { run: 'git switch -c experiment' },
      { write: { 'idea.md': '# An idea\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Try an idea"' },
      { run: 'git switch main' },
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
  ],
}

async function sandboxAtHome(): Promise<Sandbox> {
  const sandbox = await createSandbox(TEAM_SEED)
  await sandbox.run('cd ~')
  return sandbox
}

describe('git clone', () => {
  it('names the new directory after the url and reports what it received', async () => {
    const sandbox = await sandboxAtHome()

    const output = await textOf(sandbox, `git clone ${REMOTE_URL}`)
    const objects = Number(/Enumerating objects: (\d+)/.exec(output)?.[1])

    expect(objects).toBe(4)
    expect(output).toBe(
      [
        "Cloning into 'project'...",
        `remote: Enumerating objects: ${objects}, done.`,
        `remote: Counting objects: 100% (${objects}/${objects}), done.`,
        'remote: Compressing objects: 100% (2/2), done.',
        `remote: Total ${objects} (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)`,
        `Receiving objects: 100% (${objects}/${objects}), done.`,
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'ls')).toBe('my-clone  project')
  })

  it('clones into the directory you name instead', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, `git clone ${REMOTE_URL} workspace`)).toContain(
      "Cloning into 'workspace'...",
    )

    await sandbox.run('cd workspace')
    expect(await textOf(sandbox, 'ls')).toBe('index.html  README.md')
  })

  it('leaves you outside the new directory, the way real git does', async () => {
    const sandbox = await sandboxAtHome()
    await sandbox.run(`git clone ${REMOTE_URL}`)

    expect(await textOf(sandbox, 'pwd')).toBe('/home/user')
    expect((await sandbox.prompt()).directory).toBe('~')
  })

  it('refuses a destination that already holds files', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, `git clone ${REMOTE_URL} my-clone`)).toBe(
      "fatal: destination path 'my-clone' already exists and is not an empty directory.",
    )
  })

  it('refuses a url the sandbox cannot reach', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, 'git clone https://github.com/team/typo.git')).toBe(
      [
        "Cloning into 'typo'...",
        'remote: Repository not found.',
        "fatal: repository 'https://github.com/team/typo.git/' not found",
      ].join('\n'),
    )
    expect(await textOf(sandbox, 'ls')).toBe('my-clone')
  })

  it('refuses a path that is not a repository', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, 'git clone ../elsewhere')).toBe(
      [
        "Cloning into 'elsewhere'...",
        "fatal: '../elsewhere' does not appear to be a git repository",
        'fatal: Could not read from remote repository.',
        '',
        'Please make sure you have the correct access rights',
        'and the repository exists.',
      ].join('\n'),
    )
  })

  it('asks for a repository when none is given', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, 'git clone')).toBe(
      [
        'fatal: You must specify a repository to clone.',
        '',
        'usage: git clone [<options>] [--] <repo> [<dir>]',
      ].join('\n'),
    )
  })
})

describe('a freshly cloned repository', () => {
  it('starts clean, on main, tracking the remote', async () => {
    const sandbox = await sandboxAtHome()
    await sandbox.run(`git clone ${REMOTE_URL} workspace`)
    await sandbox.run('cd workspace')

    const status = await textOf(sandbox, 'git status')
    expect(status).toContain('On branch main')
    expect(status).toContain("Your branch is up to date with 'origin/main'.")
    expect(status).toContain('nothing to commit, working tree clean')

    expect(await textOf(sandbox, 'git log --oneline')).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main, origin\/main\) Initial commit$/,
    )
    expect(await textOf(sandbox, 'git branch')).toBe('* main')
    expect(await textOf(sandbox, 'git remote -v')).toBe(
      [`origin\t${REMOTE_URL} (fetch)`, `origin\t${REMOTE_URL} (push)`].join('\n'),
    )
  })

  it('pushes its own commits to the remote and a second clone pulls them down', async () => {
    const sandbox = await sandboxAtHome()
    await sandbox.run(`git clone ${REMOTE_URL} workspace`)
    await sandbox.run(`git clone ${REMOTE_URL} review`)

    await sandbox.run('cd workspace')
    await sandbox.run('echo "Ship it on Friday." > NOTES.md')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "Add release notes"')

    const pushed = await textOf(sandbox, 'git push origin main')
    expect(pushed).toContain(`To ${REMOTE_URL}`)
    expect(pushed).toContain('main -> main')

    await sandbox.run('cd ../review')
    const pulled = await textOf(sandbox, 'git pull origin main')
    expect(pulled).toContain('From https://github.com/team/project')
    expect(pulled).toContain('Fast-forward')
    expect(pulled).toContain('NOTES.md |')

    expect(await textOf(sandbox, 'ls')).toBe('index.html  NOTES.md  README.md')
    expect(await textOf(sandbox, 'cat NOTES.md')).toBe('Ship it on Friday.')
  })
})

describe('a clone of a remote with more than one branch', () => {
  it('creates only the checked-out branch locally, and lists the rest under remotes', async () => {
    const seeded = await createSandbox(TWO_BRANCH_SEED)

    expect(await textOf(seeded, 'git branch')).toBe('* main')
    expect(await textOf(seeded, 'git branch -a')).toBe(
      ['* main', '  remotes/origin/experiment', '  remotes/origin/main'].join('\n'),
    )
    expect(await textOf(seeded, 'ls')).toBe('README.md')
  })

  it('reaches the same refs whether the clone was seeded or typed', async () => {
    const seeded = await createSandbox(TWO_BRANCH_SEED)
    await seeded.run('cd ~')
    await seeded.run(`git clone ${REMOTE_URL} typed`)
    await seeded.run('cd typed')

    expect(await textOf(seeded, 'git branch -a')).toBe(
      ['* main', '  remotes/origin/experiment', '  remotes/origin/main'].join('\n'),
    )
    expect(await textOf(seeded, 'git status')).toContain(
      "Your branch is up to date with 'origin/main'.",
    )
  })

  it('keeps the remote-only branch reachable through its remote-tracking name', async () => {
    const seeded = await createSandbox(TWO_BRANCH_SEED)

    expect(await textOf(seeded, 'git log --oneline origin/experiment')).toContain('Try an idea')
    expect(await textOf(seeded, 'git log --oneline')).not.toContain('Try an idea')
  })
})

describe('a url without the .git ending', () => {
  const BARE_URL = 'https://github.com/team/project'

  it('clones the same repository, the way GitHub accepts both', async () => {
    const sandbox = await sandboxAtHome()

    expect(await textOf(sandbox, `git clone ${BARE_URL}`)).toContain("Cloning into 'project'...")
    await sandbox.run('cd project')
    expect(await textOf(sandbox, 'git log --oneline')).toContain('Initial commit')
  })

  it('keeps the url as typed for origin', async () => {
    const sandbox = await sandboxAtHome()
    await sandbox.run(`git clone ${BARE_URL}`)
    await sandbox.run('cd project')

    expect(await textOf(sandbox, 'git remote -v')).toBe(
      [`origin\t${BARE_URL} (fetch)`, `origin\t${BARE_URL} (push)`].join('\n'),
    )
  })

  it('counts as a clone of the hosted repository', async () => {
    const sandbox = await sandboxAtHome()
    await sandbox.run(`git clone ${BARE_URL}`)

    expect((await sandbox.snapshot()).clones).toContain('project')
  })

  it('pushes to a remote added with a trailing slash', async () => {
    const sandbox = await createSandbox({ ...SOLO_SEED, remote: { name: 'origin', url: REMOTE_URL, cloned: false } })
    await sandbox.run(`git remote add origin ${BARE_URL}/`)

    expect(await textOf(sandbox, 'git push -u origin main')).toContain('* [new branch]      main -> main')
  })
})

describe('a remote at a url the sandbox does not host', () => {
  const MISSING = 'https://github.com/original-owner/project.git'

  function notFound(): string {
    return ['remote: Repository not found.', `fatal: repository '${MISSING}/' not found`].join('\n')
  }

  async function withSecondRemote(): Promise<Sandbox> {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run(`git remote add upstream ${MISSING}`)
    return sandbox
  }

  it('refuses to pull from it', async () => {
    const sandbox = await withSecondRemote()

    expect(await textOf(sandbox, 'git pull upstream main')).toBe(notFound())
  })

  it('refuses to push to it', async () => {
    const sandbox = await withSecondRemote()

    expect(await textOf(sandbox, 'git push upstream main')).toBe(notFound())
  })

  it('refuses a remote name that was never added', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    expect(await textOf(sandbox, 'git push nosuch main')).toBe(
      [
        "fatal: 'nosuch' does not appear to be a git repository",
        'fatal: Could not read from remote repository.',
        '',
        'Please make sure you have the correct access rights',
        'and the repository exists.',
      ].join('\n'),
    )
  })

  it('still reaches the hosted remote under another name', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run(`git remote add mirror ${REMOTE_URL}`)

    expect(await textOf(sandbox, 'git pull mirror main')).toContain('-> mirror/main')
  })
})

describe('a repository with no remote configured', () => {
  it('tells you how to add a push destination', async () => {
    const sandbox = await createSandbox(SOLO_SEED)

    expect(await textOf(sandbox, 'git push')).toBe(
      [
        'fatal: No configured push destination.',
        'Either specify the URL from the command-line or configure a remote repository using',
        '',
        '    git remote add <name> <url>',
        '',
        'and then push using the remote name',
        '',
        '    git push <name>',
      ].join('\n'),
    )
  })
})
