import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

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

const TEAM_SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: 'https://github.com/team/project.git',
    setup: [
      { write: { 'README.md': '# Project\n' } },
      { run: 'git add .' },
      { run: 'git commit -m "Initial commit"' },
    ],
    ahead: [{ write: { 'notes.md': 'from a teammate\n' } }, { run: 'git add .' }, { run: 'git commit -m "Add notes"' }],
  },
}

async function subjectAt(sandbox: Sandbox, position: number): Promise<string> {
  const line = await textOf(sandbox, `git log --oneline -1 HEAD@{${position}}`)
  return /^[0-9a-f]{7}(?: \(.*?\))? (.*)$/.exec(line)?.[1] ?? line
}

async function subjectsFromNewest(sandbox: Sandbox, count: number): Promise<string[]> {
  const subjects: string[] = []
  for (let position = 0; position < count; position += 1) subjects.push(await subjectAt(sandbox, position))
  return subjects
}

async function branchedSandbox(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -c add-navbar')
  await sandbox.run('echo "<nav></nav>" > nav.html')
  await sandbox.run('git add nav.html')
  await sandbox.run('git commit -m "Add the navbar"')
  await sandbox.run('git switch main')
  return sandbox
}

describe('HEAD@{n}, the places HEAD has stood, newest first', () => {
  it('counts each commit, starting from the first', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await subjectsFromNewest(sandbox, 2)).toEqual(['Add stylesheet', 'Initial commit'])
    expect(await textOf(sandbox, 'git log --oneline -1 HEAD@{2}')).toBe("fatal: log for 'HEAD' only has 2 entries")
  })

  it('keeps the commit an amend replaced one step back', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git commit --amend -m "Add site styles"')

    expect(await subjectsFromNewest(sandbox, 3)).toEqual(['Add site styles', 'Add stylesheet', 'Initial commit'])
  })

  it('records each switch and a fast-forward merge', async () => {
    const sandbox = await branchedSandbox()
    await sandbox.run('git merge add-navbar')

    expect(await subjectsFromNewest(sandbox, 6)).toEqual([
      'Add the navbar',
      'Add stylesheet',
      'Add the navbar',
      'Add stylesheet',
      'Add stylesheet',
      'Initial commit',
    ])
  })

  it('records a merge commit', async () => {
    const sandbox = await branchedSandbox()
    await sandbox.run('echo "footer" > footer.html')
    await sandbox.run('git add footer.html')
    await sandbox.run('git commit -m "Add the footer"')
    await sandbox.run('git merge add-navbar')

    expect(await subjectsFromNewest(sandbox, 2)).toEqual(["Merge branch 'add-navbar'", 'Add the footer'])
  })

  it('starts a clone with one place, the commit it checked out', async () => {
    const sandbox = await createSandbox(TEAM_SEED)

    expect(await subjectAt(sandbox, 0)).toBe('Initial commit')
    expect(await textOf(sandbox, 'git log --oneline -1 HEAD@{1}')).toBe("fatal: log for 'HEAD' only has 1 entries")
  })

  it('records a pull', async () => {
    const sandbox = await createSandbox(TEAM_SEED)
    await sandbox.run('git pull')

    expect(await subjectsFromNewest(sandbox, 2)).toEqual(['Add notes', 'Initial commit'])
  })

  it('records a stash as a move back to the same commit', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('echo "body { margin: 1px; }" > style.css')
    await sandbox.run('git stash')

    expect(await subjectsFromNewest(sandbox, 3)).toEqual(['Add stylesheet', 'Add stylesheet', 'Initial commit'])
  })
})
