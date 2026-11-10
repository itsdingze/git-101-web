import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const URL = 'https://github.com/team/project.git'

const SEED: SandboxSeed = {
  dir: 'home',
  remote: {
    name: 'origin',
    url: URL,
    cloned: false,
    setup: [
      { write: { 'f.txt': 'one\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
      { run: 'git switch -q -c dev' },
      { write: { 'd.txt': 'd\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m d2' },
      { write: { 'd.txt': 'd\nd3\n' } },
      { run: 'git commit -q -am d3' },
      { run: 'git switch -q main' },
      { write: { 'f.txt': 'one\nm2\n' } },
      { run: 'git commit -q -am m2' },
    ],
  },
}

function hashes(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH')
}

async function cloned(line: string, folder: string): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run(line)
  await sandbox.run(`cd ${folder}`)
  return sandbox
}

describe('git clone --depth', () => {
  it('keeps only the newest commits', async () => {
    const sandbox = await cloned(`git clone --depth 1 ${URL} c1`, 'c1')

    expect(hashes(await textOf(sandbox, 'git log --oneline'))).toBe('HASH (grafted, HEAD -> main, origin/main) m2')
  })

  it('reads --depth=', async () => {
    const sandbox = await cloned(`git clone --depth=1 ${URL} c1`, 'c1')

    expect((await textOf(sandbox, 'git log --oneline')).split('\n')).toHaveLength(1)
  })

  it('fetches only the one branch', async () => {
    const sandbox = await cloned(`git clone --depth 1 ${URL} c1`, 'c1')

    expect(await textOf(sandbox, 'git branch -a')).toBe('* main\n  remotes/origin/main')
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/main'.")
  })

  it('combines with -b', async () => {
    const sandbox = await cloned(`git clone --depth 2 -b dev ${URL} c5`, 'c5')

    expect(hashes(await textOf(sandbox, 'git log --oneline'))).toBe('HASH (HEAD -> dev, origin/dev) d3\nHASH (grafted) d2')
    expect(await textOf(sandbox, 'git branch -a')).toBe('* dev\n  remotes/origin/dev')
  })

  it.each([['abc'], ['0']])('refuses a depth of %s', async (depth) => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `git clone --depth ${depth} ${URL} c1`)).toBe(`fatal: depth ${depth} is not a positive number`)
  })

  it('reports only the objects of the commits it keeps', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `git clone --depth 1 ${URL} c1`)).toMatch(/^Cloning into 'c1'\.\.\.\nremote: Enumerating objects: 3, done\./)
  })

  it.each([['git log --oneline HEAD~1'], ['git show -s HEAD~1'], ['git diff --stat HEAD~1'], ['git log --oneline HEAD^']])(
    'cannot reach older history with %s',
    async (line) => {
      const sandbox = await cloned(`git clone --depth 1 ${URL} c1`, 'c1')

      expect(await textOf(sandbox, line)).toMatch(/^fatal: ambiguous argument 'HEAD[~^]1?': unknown revision or path not in the working tree\./)
    },
  )

  it('still reaches the commits inside the depth', async () => {
    const sandbox = await cloned(`git clone --depth 2 -b dev ${URL} c5`, 'c5')

    expect(await textOf(sandbox, 'git log --format=%s HEAD~1')).toBe('d2')
    expect(await textOf(sandbox, 'git log --format=%s HEAD~2')).toMatch(/^fatal: ambiguous argument 'HEAD~2'/)
  })

  it('shows the oldest kept commit as a first commit', async () => {
    const sandbox = await cloned(`git clone --depth 1 ${URL} c1`, 'c1')

    expect(await textOf(sandbox, 'git show --stat --format=%s')).toBe(['m2', '', ' f.txt | 2 ++', ' 1 file changed, 2 insertions(+)'].join('\n'))
    expect(await textOf(sandbox, 'git log --stat --format=%s')).toBe(['m2', '', ' f.txt | 2 ++', ' 1 file changed, 2 insertions(+)'].join('\n'))
  })
})

describe('git clone -b', () => {
  it('checks out the named branch and tracks it', async () => {
    const sandbox = await cloned(`git clone -b dev ${URL} c2`, 'c2')

    expect(await textOf(sandbox, 'git status')).toContain("On branch dev\nYour branch is up to date with 'origin/dev'.")
    expect(await textOf(sandbox, 'git branch -a')).toBe('* dev\n  remotes/origin/dev\n  remotes/origin/main')
    expect(hashes(await textOf(sandbox, 'git log --oneline'))).toBe('HASH (HEAD -> dev, origin/dev) d3\nHASH d2\nHASH Initial commit')
  })

  it('reads --branch=', async () => {
    const sandbox = await cloned(`git clone --branch=dev ${URL} c3`, 'c3')

    expect(await textOf(sandbox, 'git status')).toContain('On branch dev')
  })

  it('refuses a missing branch and leaves nothing behind', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, `git clone -b nope ${URL} c4`)).toBe(
      "Cloning into 'c4'...\nfatal: Remote branch nope not found in upstream origin",
    )
    expect((await sandbox.run('ls c4')).outputs[0]?.stream).toBe('stderr')
  })
})
