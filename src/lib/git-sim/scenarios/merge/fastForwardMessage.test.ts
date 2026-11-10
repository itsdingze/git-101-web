import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

describe('a fast-forward with -m', () => {
  it('says the message is ignored', async () => {
    const sandbox = await createSandbox({
      dir: 'project',
      setup: [
        { run: 'git init' },
        { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
        { run: 'git add .' },
        { run: 'git commit -q -m "Initial commit"' },
      ],
    })
    await sandbox.run('git switch -q -c w')
    await sandbox.writeFile('w.txt', 'a\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -qm w')
    await sandbox.run('git switch -q main')

    expect(await textOf(sandbox, 'git merge -m note w')).toMatch(/^Updating [0-9a-f]{7}\.\.[0-9a-f]{7}\nFast-forward \(no commit created; -m option ignored\)\n/)
  })
})
