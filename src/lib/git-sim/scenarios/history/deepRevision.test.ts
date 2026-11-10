import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': 'one\n' } },
    { run: 'git add .' },
    { run: 'git commit -m first' },
    { write: { 'f.txt': 'two\n' } },
    { run: 'git commit -am second' },
  ],
}

const AMBIGUOUS = (spec: string): string =>
  [
    `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
    "Use '--' to separate paths from revisions, like this:",
    "'git <command> [<revision>...] -- [<file>...]'",
  ].join('\n')

describe('a revision far past the start of history', () => {
  it('fails the way git does without allocating by the count', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log HEAD~999999999')).toBe(AMBIGUOUS('HEAD~999999999'))
  })

  it('survives a count too large to represent exactly', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log HEAD~999999999999999999999')).toBe(AMBIGUOUS('HEAD~999999999999999999999'))
  })

  it('still reads the revisions that exist', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --oneline HEAD~1')).toContain('first')
  })

  it('reads a chain of suffixes', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git log --oneline HEAD^~0')).toContain('first')
  })
})
