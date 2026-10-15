import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const NAVBAR = ['<nav>', '  <a href="/">Home</a>', '</nav>', ''].join('\n')

const BRANCHING_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n', 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'navbar.html': NAVBAR } },
  ],
}

const MERGE_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n', 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { run: 'git switch -c add-navbar' },
    { write: { 'navbar.html': NAVBAR } },
    { run: 'git add .' },
    { run: 'git commit -m "Add navbar"' },
    { run: 'git switch main' },
    { write: { 'index.html': '<h1>My project</h1>\n<a href="/about">About</a>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Fix broken link in header"' },
  ],
}

const TEAM_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [
      { write: { 'README.md': '# Project\n', 'index.html': '<h1>Team project</h1>\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [
      { write: { 'README.md': '# Project\n\nSet up instructions live in the wiki.\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Expand the README"' },
    ],
  },
  setup: [{ write: { 'login.html': '<form></form>\n', 'auth.js': 'export const auth = {}\n' } }],
}

describe('branches keep work separate', () => {
  it('hides a branch-only file when you switch away and brings it back', async () => {
    const sandbox = await createSandbox(BRANCHING_SEED)

    expect(await textOf(sandbox, 'git switch -c add-navbar')).toBe(
      "Switched to a new branch 'add-navbar'",
    )
    await sandbox.run('git add .')
    expect(await textOf(sandbox, 'git commit -m "Add navbar"')).toContain('[add-navbar')

    expect(await textOf(sandbox, 'git switch main')).toBe("Switched to branch 'main'")
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')

    expect(await textOf(sandbox, 'git switch add-navbar')).toBe("Switched to branch 'add-navbar'")
    expect(await textOf(sandbox, 'ls')).toBe('index.html  navbar.html  style.css')
  })

  it('refuses to switch to a branch that does not exist', async () => {
    const sandbox = await createSandbox(BRANCHING_SEED)
    expect(await textOf(sandbox, 'git switch add-nav')).toBe('fatal: invalid reference: add-nav')
  })
})

describe('the merge loop', () => {
  it('creates a merge commit and draws the fork in the graph', async () => {
    const sandbox = await createSandbox(MERGE_SEED)

    const merged = await textOf(sandbox, 'git merge add-navbar')
    expect(merged).toContain("Merge made by the 'ort' strategy.")
    expect(merged).toContain('navbar.html |')
    expect(merged).toContain('create mode 100644 navbar.html')

    const graph = (await textOf(sandbox, 'git log --oneline --graph')).split('\n')
    expect(graph[0]).toMatch(/^\* {3}[0-9a-f]{7} \(HEAD -> main\) Merge branch 'add-navbar'/)
    expect(graph[1]).toBe('|\\')
    expect(graph[2]).toMatch(/^\| \* [0-9a-f]{7} \(add-navbar\) Add navbar$/)
    expect(graph[3]).toMatch(/^\* \| [0-9a-f]{7} Fix broken link in header$/)
    expect(graph[4]).toBe('|/')
    expect(graph[5]).toMatch(/^\* [0-9a-f]{7} Initial commit$/)
  })

  it('deletes the merged branch and refuses when work would be lost', async () => {
    const sandbox = await createSandbox(MERGE_SEED)

    expect(await textOf(sandbox, 'git branch -d add-navbar')).toBe(
      "error: The branch 'add-navbar' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D add-navbar'.",
    )

    await sandbox.run('git merge add-navbar')
    expect(await textOf(sandbox, 'git branch -d add-navbar')).toMatch(
      /^Deleted branch add-navbar \(was [0-9a-f]{7}\)\.$/,
    )
    expect(await textOf(sandbox, 'git branch')).toBe('* main')
  })

  it('deletes every branch it is given, reporting each one', async () => {
    const sandbox = await createSandbox(MERGE_SEED)
    await sandbox.run('git branch spare')
    await sandbox.run('git merge add-navbar')

    const result = await sandbox.run('git branch -d add-navbar missing spare')

    expect(result.outputs.map((output) => [output.stream, output.text])).toEqual([
      ['stdout', expect.stringMatching(/^Deleted branch add-navbar \(was [0-9a-f]{7}\)\.$/)],
      ['stderr', "error: branch 'missing' not found."],
      ['stdout', expect.stringMatching(/^Deleted branch spare \(was [0-9a-f]{7}\)\.$/)],
    ])
    expect(await textOf(sandbox, 'git branch')).toBe('* main')
  })

  it('will not delete the branch you are standing on', async () => {
    const sandbox = await createSandbox(MERGE_SEED)
    expect(await textOf(sandbox, 'git branch -d main')).toContain("Cannot delete branch 'main'")
  })

  it('asks for a branch name when told to delete without one', async () => {
    const sandbox = await createSandbox(MERGE_SEED)
    const result = await sandbox.run('git branch -d')

    expect(result.outputs).toEqual([{ stream: 'stderr', text: 'fatal: branch name required' }])
  })

  it('says renaming a branch is outside the course', async () => {
    const sandbox = await createSandbox(MERGE_SEED)
    expect(await textOf(sandbox, 'git branch -m main trunk')).toBe("fatal: this course doesn't simulate git branch -m.")
  })
})

describe('working with a remote', () => {
  it('reads as up to date with origin/main before anything is fetched', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/main'.")
  })

  it('fast-forwards on pull and pushes a new branch upstream', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    const pulled = await textOf(sandbox, 'git pull origin main')
    expect(pulled).toContain('From https://github.com/team/project')
    expect(pulled).toContain('Fast-forward')
    expect(pulled).toContain('README.md |')

    await sandbox.run('git switch -c feature/add-auth')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "feat: add login page"')

    const pushed = await textOf(sandbox, 'git push -u origin feature/add-auth')
    expect(pushed).toContain('To https://github.com/team/project.git')
    expect(pushed).toContain(' * [new branch]      feature/add-auth -> feature/add-auth')
    expect(pushed).toContain("branch 'feature/add-auth' set up to track 'origin/feature/add-auth'.")

    const snapshot = await sandbox.snapshot()
    expect(snapshot.tracking['feature/add-auth']).toEqual({ ahead: 0, behind: 0 })
  })

  it('rejects a push that would overwrite work on the remote', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "local work"')

    const pushed = await textOf(sandbox, 'git push origin main')
    expect(pushed).toContain('! [rejected]')
    expect(pushed).toContain('failed to push some refs')
  })
})

describe('a branch name that clashes with a folder of branch names', () => {
  it.each(['git branch', 'git switch -c'])(
    '%s feature/add-auth is refused while a branch called feature exists',
    async (create) => {
      const sandbox = await createSandbox(BRANCHING_SEED)
      await sandbox.run('git branch feature')

      expect(await textOf(sandbox, `${create} feature/add-auth`)).toBe(
        "fatal: cannot lock ref 'refs/heads/feature/add-auth': 'refs/heads/feature' exists; cannot create 'refs/heads/feature/add-auth'",
      )
      expect((await sandbox.snapshot()).branch).toBe('main')
    },
  )

  it.each(['git branch', 'git switch -c'])(
    '%s feature is refused while feature/add-auth exists',
    async (create) => {
      const sandbox = await createSandbox(BRANCHING_SEED)
      await sandbox.run('git branch feature/add-auth')

      expect(await textOf(sandbox, `${create} feature`)).toBe(
        "fatal: cannot lock ref 'refs/heads/feature': 'refs/heads/feature/add-auth' exists; cannot create 'refs/heads/feature'",
      )
    },
  )
})
