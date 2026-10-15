import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const URL = 'https://github.com/you/garden-notes.git'

async function emptyRemote(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'garden-notes',
    remote: { name: 'origin', url: URL, cloned: false },
    setup: [{ run: 'git init' }],
  })
  await sandbox.run('cd ~')
  return sandbox
}

describe('cloning a repository nobody has pushed to yet', () => {
  it('warns that it is empty, like real git', async () => {
    const sandbox = await emptyRemote()

    expect(await textOf(sandbox, `git clone ${URL} copy`)).toBe(
      "Cloning into 'copy'...\nwarning: You appear to have cloned an empty repository.",
    )
  })

  it('leaves a working empty repository on main, connected to origin', async () => {
    const sandbox = await emptyRemote()
    await sandbox.run(`git clone ${URL} copy`)
    await sandbox.run('cd copy')

    expect(await textOf(sandbox, 'git status')).toBe(
      'On branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use "git add" to track)',
    )
    expect(await textOf(sandbox, 'git remote -v')).toBe(`origin\t${URL} (fetch)\norigin\t${URL} (push)`)
  })
})
