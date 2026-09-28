import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'

async function textOf(sandbox: Sandbox, line: string): Promise<string> {
  const result = await sandbox.run(line)
  return result.outputs.map((output) => output.text).join('\n')
}

async function playedFrom(lines: readonly string[]): Promise<Sandbox> {
  const sandbox = await createSandbox({ dir: 'project' })
  for (const line of ['git init', 'echo a > a', 'echo b > b', 'git add .', 'git commit -m c1', ...lines]) {
    await sandbox.run(line)
  }
  return sandbox
}

const STASH_CONFLICT = ['echo b2 > b', 'git stash', 'echo b3 > b', 'git commit -am b3', 'git stash pop']

describe('leftovers around conflicts, matched to git 2.51', () => {
  it('names an unmerged path in git diff --cached instead of showing a diff', async () => {
    const sandbox = await playedFrom([
      'git switch -c f',
      'echo af > a',
      'git commit -am f',
      'git switch main',
      'echo am > a',
      'git commit -am m',
      'git merge f',
    ])

    expect(await textOf(sandbox, 'git diff --cached')).toBe('* Unmerged path a')
  })

  it('lets git commit -am record a file still in a stash conflict, markers and all', async () => {
    const sandbox = await playedFrom(STASH_CONFLICT)

    expect(await textOf(sandbox, 'git commit -am x')).toMatch(/^\[main [0-9a-f]{7}\] x\n 1 file changed, 4 insertions\(\+\)/)
    expect(await textOf(sandbox, 'git status -s')).toBe('')
  })

  it('leaves no trace of its working ref in .git/refs after a stash pop', async () => {
    const sandbox = await playedFrom(STASH_CONFLICT)

    expect(await textOf(sandbox, 'ls .git/refs')).toBe('heads  stash  tags')
  })
})
