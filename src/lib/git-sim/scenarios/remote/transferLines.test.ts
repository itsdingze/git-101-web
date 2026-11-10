import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const URL = 'https://github.com/team/project.git'

const SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: URL,
    setup: [{ write: { 'f.txt': 'one\ntwo\nthree\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
  },
}

function longFile(extra: string): string {
  return `${Array.from({ length: 200 }, (_, index) => `shared line number ${index}`).join('\n')}\n${extra}\n`
}

async function withNewCommit(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('a.txt', longFile('first'))
  await sandbox.run('git add .')
  await sandbox.run('git commit -q -m a')
  return sandbox
}

describe('git push progress lines', () => {
  it('matches the shape real git prints', async () => {
    const sandbox = await withNewCommit()

    const lines = (await textOf(sandbox, 'git push')).split('\n')

    expect(lines[0]).toMatch(/^Enumerating objects: \d+, done\.$/)
    expect(lines[1]).toMatch(/^Counting objects: 100% \(\d+\/\d+\), done\.$/)
    expect(lines[2]).toBe('Delta compression using up to 12 threads')
    expect(lines[3]).toMatch(/^Compressing objects: 100% \(\d+\/\d+\), done\.$/)
    expect(lines[4]).toMatch(/^Writing objects: 100% \(\d+\/\d+\), [\d.]+ (bytes|KiB) \| [\d.]+ KiB\/s, done\.$/)
    expect(lines[5]).toMatch(/^Total \d+ \(delta \d+\), reused 0 \(delta 0\), pack-reused 0 \(from 0\)$/)
    expect(lines[6]).toBe(`To ${URL}`)
  })

  it('uses the same total on the writing and total lines', async () => {
    const sandbox = await withNewCommit()

    const text = await textOf(sandbox, 'git push')

    const written = /Writing objects: 100% \((\d+)\/\1\)/.exec(text)?.[1]
    expect(text).toContain(`Total ${written} (delta`)
  })

  it('prints only a total when nothing needs sending', async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.run('git switch -c same')

    const lines = (await textOf(sandbox, 'git push origin same')).split('\n')

    expect(lines[0]).toBe('Total 0 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)')
    expect(lines).not.toContain('Enumerating objects: 2, done.')
    expect(lines.join('\n')).toContain(`To ${URL}`)
  })

  it('counts a small edit to a long file as a delta', async () => {
    const sandbox = await withNewCommit()
    await sandbox.run('git push')
    await sandbox.writeFile('a.txt', longFile('second'))
    await sandbox.run('git commit -qam b')

    expect(await textOf(sandbox, 'git push')).toMatch(/Total \d+ \(delta [1-9]\d*\), reused 0/)
  })

  it('stays quiet with -q', async () => {
    const sandbox = await withNewCommit()

    expect((await sandbox.run('git push -q')).outputs).toEqual([])
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/main'.")
  })
})

describe('git clone progress lines', () => {
  const CLONE_SEED: SandboxSeed = {
    dir: 'home',
    remote: {
      name: 'origin',
      url: URL,
      cloned: false,
      setup: [
        { write: { 'a.txt': longFile('first') } },
        { run: 'git add .' },
        { run: 'git commit -q -m one' },
        { write: { 'a.txt': longFile('second') } },
        { run: 'git commit -q -am two' },
      ],
    },
  }

  it('reports the deltas it resolved', async () => {
    const sandbox = await createSandbox(CLONE_SEED)

    const lines = (await textOf(sandbox, `git clone ${URL} c`)).split('\n')

    const deltas = /delta (\d+)/.exec(lines[4] ?? '')?.[1]
    expect(Number(deltas)).toBeGreaterThan(0)
    expect(lines[5]).toMatch(/^Receiving objects: 100% \(\d+\/\d+\), done\.$/)
    expect(lines[6]).toBe(`Resolving deltas: 100% (${deltas}/${deltas}), done.`)
  })

  it('omits delta resolution when there are none', async () => {
    const sandbox = await createSandbox({
      dir: 'home',
      remote: { name: 'origin', url: URL, cloned: false, setup: [{ write: { 'f.txt': 'x\n' } }, { run: 'git add .' }, { run: 'git commit -q -m one' }] },
    })

    expect(await textOf(sandbox, `git clone ${URL} c`)).not.toContain('Resolving deltas')
  })
})
