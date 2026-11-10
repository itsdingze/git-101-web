import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'keep.txt': 'x\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m base' },
  ],
}

function linesOf(prefix: string, count: number): string {
  return `${Array.from({ length: count }, (_, index) => `${prefix} ${index}`).join('\n')}\n`
}

async function rewrittenFile(count: number): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.writeFile('big.txt', linesOf('old', count))
  await sandbox.run('git add big.txt')
  await sandbox.run('git commit -q -m add')
  await sandbox.writeFile('big.txt', linesOf('new', count))
  return sandbox
}

function changedLineCounts(patch: string): { removed: number; added: number } {
  const lines = patch.split('\n')
  return {
    removed: lines.filter((line) => line.startsWith('-') && !line.startsWith('---')).length,
    added: lines.filter((line) => line.startsWith('+') && !line.startsWith('+++')).length,
  }
}

async function timed<T>(work: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> {
  const started = performance.now()
  const result = await work()
  return { result, elapsedMs: performance.now() - started }
}

describe('a diff with every line changed', () => {
  it('stays fast at ten thousand lines', { timeout: 30_000 }, async () => {
    const sandbox = await rewrittenFile(10_000)

    const { result: patch, elapsedMs } = await timed(() => textOf(sandbox, 'git diff'))

    expect(elapsedMs).toBeLessThan(2_000)
    expect(patch).toContain('@@ -1,10000 +1,10000 @@')
    expect(changedLineCounts(patch)).toEqual({ removed: 10_000, added: 10_000 })
  })

  it('reports exact counts for the stat too', { timeout: 30_000 }, async () => {
    const sandbox = await rewrittenFile(10_000)

    const stat = await textOf(sandbox, 'git diff --stat')

    expect(stat).toContain('1 file changed, 10000 insertions(+), 10000 deletions(-)')
  })

  it('commits quickly', { timeout: 30_000 }, async () => {
    const sandbox = await rewrittenFile(10_000)

    const { result, elapsedMs } = await timed(() => textOf(sandbox, 'git commit -am rewrite'))

    expect(elapsedMs).toBeLessThan(3_000)
    expect(result).toContain('10000 insertions(+), 10000 deletions(-)')
  })

  it('does not hang at sixty thousand lines', { timeout: 60_000 }, async () => {
    const sandbox = await rewrittenFile(60_000)

    const { result: patch, elapsedMs } = await timed(() => textOf(sandbox, 'git diff'))

    expect(elapsedMs).toBeLessThan(15_000)
    expect(changedLineCounts(patch)).toEqual({ removed: 60_000, added: 60_000 })
  })
})

describe('a large file with a small change', () => {
  it('keeps the minimal hunk', { timeout: 30_000 }, async () => {
    const sandbox = await createSandbox(SEED)
    const original = linesOf('line', 5_000)
    await sandbox.writeFile('big.txt', original)
    await sandbox.run('git add big.txt')
    await sandbox.run('git commit -q -m add')
    await sandbox.writeFile('big.txt', original.replace('line 2500\n', 'changed 2500\n'))

    const patch = await textOf(sandbox, 'git diff')

    expect(changedLineCounts(patch)).toEqual({ removed: 1, added: 1 })
    expect(patch).toContain('@@ -2498,7 +2498,7 @@')
  })
})

describe('a whole-file replacement hunk', () => {
  it('marks a missing final newline on each side', { timeout: 30_000 }, async () => {
    const sandbox = await createSandbox(SEED)
    await sandbox.writeFile('big.txt', linesOf('old', 3_000).trimEnd())
    await sandbox.run('git add big.txt')
    await sandbox.run('git commit -q -m add')
    await sandbox.writeFile('big.txt', linesOf('new', 3_000).trimEnd())

    const lines = (await textOf(sandbox, 'git diff')).split('\n')

    expect(lines.filter((line) => line === '\\ No newline at end of file')).toHaveLength(2)
    expect(lines[lines.length - 1]).toBe('\\ No newline at end of file')
  })

  it('keeps unchanged lines at the edges as context', { timeout: 30_000 }, async () => {
    const sandbox = await createSandbox(SEED)
    const body = (prefix: string) => `top\n${linesOf(prefix, 3_000)}bottom\n`
    await sandbox.writeFile('big.txt', body('old'))
    await sandbox.run('git add big.txt')
    await sandbox.run('git commit -q -m add')
    await sandbox.writeFile('big.txt', body('new'))

    const lines = (await textOf(sandbox, 'git diff')).split('\n')

    expect(lines).toContain(' top')
    expect(lines).toContain(' bottom')
    expect(changedLineCounts(lines.join('\n'))).toEqual({ removed: 3_000, added: 3_000 })
  })
})
