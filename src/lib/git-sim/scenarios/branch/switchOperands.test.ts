import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('git switch with too many names', () => {
  it.each(['git switch main x', 'git switch -c n main x'])('%s is refused', async (line) => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
        { run: 'git add .' },
        { run: 'git commit -q -m "Initial commit"' },
      ],
    })

    expect(await textOf(sandbox, line)).toBe('fatal: only one reference expected')
  })
})
