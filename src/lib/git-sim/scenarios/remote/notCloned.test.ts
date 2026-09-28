import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { meets } from '@/lib/git-sim/goals/goalFixtures'

const URL = 'https://github.com/you/garden-notes.git'

const LOCAL_ONLY: SandboxSeed = {
  dir: 'garden-notes',
  remote: { name: 'origin', url: URL, cloned: false },
  setup: [
    { run: 'git init' },
    { write: { 'tomatoes.md': '# Tomatoes\n' } },
    { run: 'git add .' },
    { run: 'git commit -m "Start the garden notes"' },
  ],
}

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

describe('a remote that exists online but was never cloned', () => {
  it('starts as a plain local project with no remote and no tracking', async () => {
    const sandbox = await createSandbox(LOCAL_ONLY)

    expect(await textOf(sandbox, 'git remote -v')).toBe('')
    expect(await textOf(sandbox, 'git status')).toBe('On branch main\nnothing to commit, working tree clean')
    expect(await meets(sandbox, { kind: 'pushed', branch: 'main' })).toBe(false)
    expect(await meets(sandbox, { kind: 'upstream-set', branch: 'main' })).toBe(false)
  })

  it('accepts the URL as origin and pushes main into the empty repository with -u', async () => {
    const sandbox = await createSandbox(LOCAL_ONLY)

    expect(await textOf(sandbox, `git remote add origin ${URL}`)).toBe('')
    expect(await textOf(sandbox, 'git remote -v')).toBe(`origin\t${URL} (fetch)\norigin\t${URL} (push)`)

    const pushed = await textOf(sandbox, 'git push -u origin main')
    expect(pushed).toContain(`To ${URL}`)
    expect(pushed).toContain(' * [new branch]      main -> main')
    expect(pushed).toContain("branch 'main' set up to track 'origin/main'.")

    expect(await meets(sandbox, { kind: 'pushed', branch: 'main' })).toBe(true)
    expect(await meets(sandbox, { kind: 'upstream-set', branch: 'main' })).toBe(true)
    expect(await textOf(sandbox, 'git status')).toBe(
      "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
    )
  })

  it('treats a mistyped URL as a repository that does not exist', async () => {
    const sandbox = await createSandbox(LOCAL_ONLY)
    await sandbox.run('git remote add origin https://github.com/you/garden-note.git')

    expect(await textOf(sandbox, 'git push -u origin main')).toContain('remote: Repository not found.')
  })

  it('starts over as the same local project', async () => {
    const sandbox = await createSandbox(LOCAL_ONLY)
    await sandbox.run(`git remote add origin ${URL}`)
    await sandbox.run('git push -u origin main')

    await sandbox.reset()

    expect(await textOf(sandbox, 'git remote -v')).toBe('')
    expect(await meets(sandbox, { kind: 'pushed', branch: 'main' })).toBe(false)
  })
})
