import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from './createSandbox'

const SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
    { write: { 'style.css': 'body { margin: 0; }\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Add stylesheet"' },
  ],
}

const EMPTY_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [{ run: 'git init' }],
}

const ROOT_SEED: SandboxSeed = {
  dir: 'my-project',
  setup: [
    { run: 'git init' },
    { write: { 'index.html': '<h1>My project</h1>\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Initial commit"' },
  ],
}

const GIT_DATE_LINE = /^ Date: \w{3} \w{3} \d{1,2} \d{2}:\d{2}:\d{2} \d{4} \+0000$/m

const REMOTE_URL = 'https://github.com/team/project.git'

const TEAM_SEED: SandboxSeed = {
  dir: 'my-clone',
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

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function headHash(sandbox: Sandbox): Promise<string> {
  const newest = (await textOf(sandbox, 'git log --oneline')).split('\n')[0] ?? ''
  return newest.split(' ')[0] ?? ''
}

describe('git commit --amend', () => {
  it('replaces the last commit and its message with a differently hashed one', async () => {
    const sandbox = await createSandbox(SEED)
    const replaced = await headHash(sandbox)

    const output = await textOf(sandbox, 'git commit --amend -m "Add site styles"')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Add site styles$/m)
    expect(output).toMatch(GIT_DATE_LINE)
    expect(output).toContain('1 file changed, 1 insertion(+)')

    expect(await headHash(sandbox)).not.toBe(replaced)
    expect((await textOf(sandbox, 'git log --oneline')).split('\n')).toHaveLength(2)
    expect(await textOf(sandbox, 'git log --oneline')).not.toContain('Add stylesheet')
  })

  it('absorbs newly staged changes with --no-edit and keeps the old message', async () => {
    const sandbox = await createSandbox(SEED)
    const replaced = await headHash(sandbox)

    await sandbox.run('echo "body { margin: 0; padding: 0; }" > style.css')
    await sandbox.run('git add style.css')

    const output = await textOf(sandbox, 'git commit --amend --no-edit')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Add stylesheet$/m)
    expect(await headHash(sandbox)).not.toBe(replaced)
    expect(await textOf(sandbox, 'git status')).toContain('nothing to commit, working tree clean')
  })

  it('never calls an amended root commit a root-commit', async () => {
    const sandbox = await createSandbox(ROOT_SEED)

    const output = await textOf(sandbox, 'git commit --amend -m "Better message"')
    expect(output).toMatch(/^\[main [0-9a-f]{7}\] Better message$/m)
    expect(output).not.toContain('root-commit')
  })

  it('refuses to open an editor when no message is offered', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git commit --amend')).toBe(
      [
        'The sandbox has no text editor, so a commit message cannot be typed in one.',
        'Pass the message inline instead: git commit -m "your message"',
      ].join('\n'),
    )
  })

  it('has nothing to amend in a repository without commits', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await textOf(sandbox, 'git commit --amend -m "Too early"')).toBe(
      'fatal: You have nothing to amend.',
    )
  })
})

describe('git reflog', () => {
  it('lists every place HEAD has been, newest first', async () => {
    const sandbox = await createSandbox(SEED)

    const lines = (await textOf(sandbox, 'git reflog')).split('\n')
    expect(lines[0]).toMatch(/^[0-9a-f]{7} HEAD@\{0\}: commit: Add stylesheet$/)
    expect(lines[1]).toMatch(/^[0-9a-f]{7} HEAD@\{1\}: commit \(initial\): Initial commit$/)
    expect(lines).toHaveLength(2)
  })

  it('refuses to run in a repository without commits', async () => {
    const sandbox = await createSandbox(EMPTY_SEED)

    expect(await textOf(sandbox, 'git reflog')).toBe(
      "fatal: your current branch 'main' does not have any commits yet",
    )
  })

  it('names an amended commit as an amend', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git commit --amend -m "Add site styles"')

    expect((await textOf(sandbox, 'git reflog')).split('\n')[0]).toMatch(
      /^[0-9a-f]{7} HEAD@\{0\}: commit \(amend\): Add site styles$/,
    )
  })

  it('records branch moves and a fast-forward merge, but not branch creation', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git branch spare')
    await sandbox.run('git switch -c add-navbar')
    await sandbox.run('echo "<nav></nav>" > nav.html')
    await sandbox.run('git add nav.html')
    await sandbox.run('git commit -m "Add the navbar"')
    await sandbox.run('git switch main')
    await sandbox.run('git merge add-navbar')

    const reflog = await textOf(sandbox, 'git reflog')
    expect(reflog.split('\n').slice(0, 4)).toEqual([
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{0\}: merge add-navbar: Fast-forward$/),
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{1\}: checkout: moving from add-navbar to main$/),
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{2\}: commit: Add the navbar$/),
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{3\}: checkout: moving from main to add-navbar$/),
    ])
    expect(reflog).not.toContain('branch:')
  })

  it('names a merge commit as a merge', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c add-navbar')
    await sandbox.run('echo "<nav></nav>" > nav.html')
    await sandbox.run('git add nav.html')
    await sandbox.run('git commit -m "Add the navbar"')
    await sandbox.run('git switch main')
    await sandbox.run('echo "<h1>Renamed</h1>" > index.html')
    await sandbox.run('git add index.html')
    await sandbox.run('git commit -m "Rename the heading"')
    await sandbox.run('git merge add-navbar')

    expect((await textOf(sandbox, 'git reflog')).split('\n')[0]).toMatch(
      /^[0-9a-f]{7} HEAD@\{0\}: commit \(merge\): Merge branch 'add-navbar'/,
    )
  })

  it('records a clone and the pull that follows it', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git pull origin main')

    expect((await textOf(sandbox, 'git reflog')).split('\n')[0]).toMatch(
      /^[0-9a-f]{7} HEAD@\{0\}: pull: Fast-forward$/,
    )

    await sandbox.run('cd ~')
    await sandbox.run(`git clone ${REMOTE_URL}`)
    await sandbox.run('cd project')

    expect(await textOf(sandbox, 'git reflog')).toMatch(
      new RegExp(`^[0-9a-f]{7} HEAD@\\{0\\}: clone: from ${REMOTE_URL.replace(/\./g, '\\.')}$`),
    )
  })

  it('records the reset a stash performs, and nothing for the pop', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "<h1>Renamed</h1>" > index.html')
    await sandbox.run('git stash')
    await sandbox.run('git stash pop')

    expect((await textOf(sandbox, 'git reflog')).split('\n').slice(0, 2)).toEqual([
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{0\}: reset: moving to HEAD$/),
      expect.stringMatching(/^[0-9a-f]{7} HEAD@\{1\}: commit: Add stylesheet$/),
    ])
  })
})

describe('recovering a commit thrown away by git reset --hard', () => {
  it('finds the abandoned commit in the reflog and branches at it', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "console.log(1)" > app.js')
    await sandbox.run('git add app.js')
    await sandbox.run('git commit -m "Add new feature"')

    await sandbox.run('git reset --hard HEAD~1')
    expect(await textOf(sandbox, 'ls')).toBe('index.html  style.css')

    const reflog = await textOf(sandbox, 'git reflog')
    expect(reflog.split('\n')[0]).toMatch(/^[0-9a-f]{7} HEAD@\{0\}: reset: moving to HEAD~1$/)

    const abandoned = /^([0-9a-f]{7}) HEAD@\{1\}: commit: Add new feature$/m.exec(reflog)?.[1]
    expect(abandoned).toBeDefined()

    expect(await textOf(sandbox, `git switch -c recovered ${abandoned}`)).toBe(
      "Switched to a new branch 'recovered'",
    )
    expect(await textOf(sandbox, 'cat app.js')).toBe('console.log(1)')
    expect(await textOf(sandbox, 'git log --oneline')).toContain('Add new feature')
  })
})
