import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const BASE = 'one\ntwo\nthree\n'

const SEED: SandboxSeed = {
  dir: 'project',
  setup: [
    { run: 'git init' },
    { write: { 'f.txt': BASE, 'g.txt': 'alpha\n' } },
    { run: 'git add .' },
    { run: 'git commit -q -m "Initial commit"' },
    { write: { 'f.txt': `${BASE}x\n` } },
    { run: 'git commit -q -am second' },
  ],
}

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH').replace(/^Date: {3}.*$/gm, 'Date:   D')
}

const HEADER = ['commit HASH (HEAD -> main)', 'Author: Your Name <you@example.com>', 'Date:   D', '', '    second']
const STAT = [' f.txt | 1 +', ' 1 file changed, 1 insertion(+)']
const PATCH = ['diff --git a/f.txt b/f.txt', 'index HASH..HASH 100644', '--- a/f.txt', '+++ b/f.txt', '@@ -1,3 +1,4 @@', ' one', ' two', ' three', '+x']

async function withEmptyCommit(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git commit -q --allow-empty -m empty')
  return sandbox
}

async function resolvedMerge(): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run('git switch -q -c o')
  await sandbox.writeFile('f.txt', `${BASE}x\nt\n`)
  await sandbox.run('git commit -qam o')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', `${BASE}x\nm\n`)
  await sandbox.run('git commit -qam m')
  await sandbox.run('git merge o')
  await sandbox.writeFile('f.txt', `${BASE}x\nboth\n`)
  await sandbox.run('git add .')
  await sandbox.run('git commit -qm merged')
  return sandbox
}

describe('the --- divider between message and diff', () => {
  it('appears for --stat -p in the full format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log -p --stat -1'))).toBe([...HEADER, '---', ...STAT, '', ...PATCH].join('\n'))
  })

  it('appears in git show too', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show -p --stat'))).toBe([...HEADER, '---', ...STAT, '', ...PATCH].join('\n'))
    expect(masked(await textOf(sandbox, 'git show --format=%s -p --stat'))).toBe(['second', '---', ...STAT, '', ...PATCH].join('\n'))
  })

  it('is absent with --oneline', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --oneline --stat -p -1'))).toBe(['HASH (HEAD -> main) second', ...STAT, '', ...PATCH].join('\n'))
  })

  it('is absent with an empty format', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git log --format= -p --stat -1'))).toBe([...STAT, '', ...PATCH].join('\n'))
    expect(masked(await textOf(sandbox, 'git show --format= -p --stat'))).toBe([...STAT, '', ...PATCH].join('\n'))
  })

  it('is absent on an empty commit', async () => {
    const sandbox = await withEmptyCommit()

    expect(masked(await textOf(sandbox, 'git log -p --stat -1'))).not.toContain('---')
    expect(masked(await textOf(sandbox, 'git show -p --stat'))).not.toContain('---')
  })

  it('is a blank line for a merge', async () => {
    const sandbox = await resolvedMerge()

    expect(await textOf(sandbox, 'git show --format=%s -p --stat')).toContain('merged\n\n f.txt | 2 +-\n 1 file changed')
  })
})
