import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
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
const PATCH = ['diff --git a/f.txt b/f.txt', 'index HASH..HASH 100644', '--- a/f.txt', '+++ b/f.txt', '@@ -1,3 +1,4 @@', ' one', ' two', ' three', '+x']

describe('git show of several things', () => {
  it('shows each revision with --oneline', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show HEAD~1 HEAD --oneline -s'))).toBe('HASH Initial commit\nHASH (HEAD -> main) second')
  })

  it('separates full headers with a blank line', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show HEAD HEAD~1 -s'))).toBe(
      [...HEADER, '', 'commit HASH', 'Author: Your Name <you@example.com>', 'Date:   D', '', '    Initial commit'].join('\n'),
    )
  })

  it('prints each file object', async () => {
    const sandbox = await createSandbox(SEED)

    expect(await textOf(sandbox, 'git show HEAD~1:g.txt HEAD:f.txt')).toBe('alpha\none\ntwo\nthree\nx')
  })

  it('treats an operand after -- as a path', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --oneline -- f.txt'))).toBe(['HASH (HEAD -> main) second', ...PATCH].join('\n'))
  })

  it('shows only the header for a path that matches nothing', async () => {
    const sandbox = await createSandbox(SEED)

    expect(masked(await textOf(sandbox, 'git show --oneline -- nope.txt'))).toBe('HASH (HEAD -> main) second')
  })
})
