import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

async function resolved(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'f.txt': 'one\n', 'g.txt': 'alpha\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m "Initial commit"' },
    ],
  })
  await sandbox.run('git switch -q -c o')
  await sandbox.writeFile('f.txt', 'one\ntheirs\n')
  await sandbox.run('git commit -qam o')
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('f.txt', 'one\nours\n')
  await sandbox.run('git commit -qam ours')
  await sandbox.run('git merge o')
  await sandbox.writeFile('f.txt', 'one\nboth\n')
  await sandbox.run('git add .')
  return sandbox
}

describe('the message after a resolved conflict', () => {
  it('drops them with git merge --continue', async () => {
    const sandbox = await resolved()
    await sandbox.run('git merge --continue')

    expect(await textOf(sandbox, 'git log -1 --format=%B')).toBe("Merge branch 'o'\n")
  })

  it('drops them with an explicit message', async () => {
    const sandbox = await resolved()
    await sandbox.run('git commit -m custom')

    expect(await textOf(sandbox, 'git log -1 --format=%B')).toBe('custom\n')
  })
})
