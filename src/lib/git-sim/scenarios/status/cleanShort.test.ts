import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'

describe('git status with nothing to report', () => {
  it.each(['git status -s', 'git status --porcelain'])('%s prints nothing', async (line) => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
        { run: 'git add .' },
        { run: 'git commit -q -m "Initial commit"' },
      ],
    })

    expect((await sandbox.run(line)).outputs).toEqual([])
  })
})
