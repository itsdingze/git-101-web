import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function fourCommits(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': 'one\ntwo\nthree\n', 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
    ],
  })
  for (const label of ['two', 'three', 'four']) {
    await sandbox.writeFile('f.txt', `${label}\n`)
    await sandbox.run(`git commit -qam ${label}`)
  }
  return sandbox
}

describe('git log counts', () => {
  it.each(['-n -1', '--max-count=-1', '-n -2'])('%s shows every commit', async (option) => {
    const sandbox = await fourCommits()

    expect((await textOf(sandbox, `git log --oneline ${option}`)).split('\n')).toHaveLength(4)
  })

  it('reads zero as none', async () => {
    const sandbox = await fourCommits()

    expect((await sandbox.run('git log --oneline -n 0')).outputs).toEqual([])
  })
})
