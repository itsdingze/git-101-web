import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const FETCHED_FROM_HERE = ['From .', ' * branch            main       -> FETCH_HEAD']

function masked(text: string): string {
  return text.replace(/\b[0-9a-f]{7,40}\b/g, 'HASH')
}

async function featureTrackingMain(): Promise<Sandbox> {
  const sandbox = await createSandbox({
    dir: 'project',
    setup: [
      { run: 'git init' },
      { write: { 'a.txt': 'one\n' } },
      { run: 'git add .' },
      { run: 'git commit -q -m first' },
      { run: 'git config pull.rebase false' },
      { run: 'git switch -q -c feature' },
      { run: 'git branch -u main' },
    ],
  })
  return sandbox
}

async function commitOnMain(sandbox: Sandbox, contents: string, message: string): Promise<void> {
  await sandbox.run('git switch -q main')
  await sandbox.writeFile('a.txt', contents)
  await sandbox.run(`git commit -q -am ${message}`)
  await sandbox.run('git switch -q feature')
}

describe('git pull from a local upstream branch', () => {
  it('says so when there is nothing new', async () => {
    const sandbox = await featureTrackingMain()

    expect(await textOf(sandbox, 'git pull')).toBe([...FETCHED_FROM_HERE, 'Already up to date.'].join('\n'))
  })

  it('fast-forwards to the local branch', async () => {
    const sandbox = await featureTrackingMain()
    await commitOnMain(sandbox, 'one\ntwo\n', 'second')

    expect(masked(await textOf(sandbox, 'git pull'))).toBe(
      [...FETCHED_FROM_HERE, 'Updating HASH..HASH', 'Fast-forward', ' a.txt | 1 +', ' 1 file changed, 1 insertion(+)'].join('\n'),
    )
    expect(await sandbox.readFile('a.txt')).toBe('one\ntwo\n')
  })

  it('merges when both branches have new commits', async () => {
    const sandbox = await featureTrackingMain()
    await commitOnMain(sandbox, 'one\ntwo\n', 'second')
    await sandbox.writeFile('b.txt', 'b\n')
    await sandbox.run('git add b.txt')
    await sandbox.run('git commit -q -m work')

    expect(await textOf(sandbox, 'git pull')).toContain("Merge made by the 'ort' strategy.")
    expect(await textOf(sandbox, 'git log -1 --format=%s')).toBe("Merge branch 'main' into feature")
  })

  it('reads the branch from the command line', async () => {
    const sandbox = await featureTrackingMain()
    await sandbox.run('git branch --unset-upstream')
    await commitOnMain(sandbox, 'one\ntwo\n', 'second')

    await sandbox.run('git pull . main')

    expect(await sandbox.readFile('a.txt')).toBe('one\ntwo\n')
  })

  it('refuses a local branch that does not exist', async () => {
    const sandbox = await featureTrackingMain()

    expect(await textOf(sandbox, 'git pull . nope')).toBe("fatal: couldn't find remote ref nope")
  })
})
