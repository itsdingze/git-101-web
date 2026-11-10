import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('git branch filter patterns', () => {
  it('keeps only names matching the pattern', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
        { run: 'git add .' },
        { run: 'git commit -q -m "Initial commit"' },
      ],
    })
    await sandbox.run('git branch a')
    await sandbox.run('git branch ab')
    await sandbox.run('git branch b')

    expect(await textOf(sandbox, 'git branch --merged main "a*"')).toBe('  a\n  ab')
    expect(await textOf(sandbox, 'git branch --contains main b')).toBe('  b')
  })
})
