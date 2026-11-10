import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'

const URL = 'https://github.com/team/project.git'

const SEED: SandboxSeed = {
  dir: 'project',
  remote: {
    name: 'origin',
    url: URL,
    setup: [{ write: { 'f.txt': 'one\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
  },
}

async function onNewBranch(name: string): Promise<Sandbox> {
  const sandbox = await createSandbox(SEED)
  await sandbox.run(`git switch -c ${name}`)
  await sandbox.writeFile('f.txt', 'one\ntwo\n')
  await sandbox.run(`git commit -am "${name} work"`)
  return sandbox
}

function reportLines(text: string): string[] {
  return text.split('\n').filter((line) => !/^remote:|objects:|^Total |^Delta compression/.test(line))
}

describe('git push origin HEAD', () => {
  it('pushes the current branch', async () => {
    const sandbox = await onNewBranch('x')

    expect(reportLines(await textOf(sandbox, 'git push origin HEAD'))).toEqual([`To ${URL}`, ' * [new branch]      HEAD -> x'])
    expect(await textOf(sandbox, 'git branch -r')).toContain('origin/x')
  })

  it('sets the upstream with -u', async () => {
    const sandbox = await onNewBranch('x')

    expect(reportLines(await textOf(sandbox, 'git push -u origin HEAD'))).toEqual([
      `To ${URL}`,
      ' * [new branch]      HEAD -> x',
      "branch 'x' set up to track 'origin/x'.",
    ])
    expect(await textOf(sandbox, 'git status')).toContain("Your branch is up to date with 'origin/x'.")
  })

  it('reports up to date with the upstream line after', async () => {
    const sandbox = await onNewBranch('x')
    await sandbox.run('git push origin x')

    expect(await textOf(sandbox, 'git push -u origin HEAD')).toBe(
      "branch 'x' set up to track 'origin/x'.\nEverything up-to-date",
    )
  })
})

describe('git push origin a:b', () => {
  it('pushes the local branch to another remote name', async () => {
    const sandbox = await onNewBranch('x')

    expect(reportLines(await textOf(sandbox, 'git push origin x:y'))).toEqual([`To ${URL}`, ' * [new branch]      x -> y'])
    expect(await textOf(sandbox, 'git branch -r')).toContain('origin/y')
    expect(await textOf(sandbox, 'git branch -r')).not.toContain('origin/x')
  })

  it('sets the upstream to the remote name with -u', async () => {
    const sandbox = await onNewBranch('x')

    expect(await textOf(sandbox, 'git push -u origin x:w')).toContain("branch 'x' set up to track 'origin/w'.")
  })

  it('reads HEAD as the source', async () => {
    const sandbox = await onNewBranch('x')

    expect(reportLines(await textOf(sandbox, 'git push origin HEAD:z'))).toEqual([`To ${URL}`, ' * [new branch]      HEAD -> z'])
  })

  it('names a missing source like git does', async () => {
    const sandbox = await onNewBranch('x')

    expect(await textOf(sandbox, 'git push origin nope')).toBe(
      `error: src refspec nope does not match any\nerror: failed to push some refs to '${URL}'`,
    )
  })

  it('forces a single ref with a leading plus', async () => {
    const sandbox = await onNewBranch('x')
    await sandbox.run('git push origin x')
    await sandbox.run('git commit --amend -m "rewritten"')

    expect(await textOf(sandbox, 'git push origin +x:x')).toContain('(forced update)')
  })
})

describe('deleting a remote branch', () => {
  async function pushed(): Promise<Sandbox> {
    const sandbox = await onNewBranch('x')
    await sandbox.run('git push -u origin x')
    return sandbox
  }

  it.each(['git push origin --delete x', 'git push origin -d x', 'git push --delete origin x', 'git push origin :x'])(
    '%s removes it and its local tracking ref',
    async (line) => {
      const sandbox = await pushed()

      expect(await textOf(sandbox, line)).toBe(`To ${URL}\n - [deleted]         x`)
      expect(await textOf(sandbox, 'git branch -r')).not.toContain('origin/x')
    },
  )

  it('leaves the upstream gone', async () => {
    const sandbox = await pushed()
    await sandbox.run('git push origin --delete x')

    expect(await textOf(sandbox, 'git status')).toContain(
      "Your branch is based on 'origin/x', but the upstream is gone.\n  (use \"git branch --unset-upstream\" to fixup)",
    )
    expect(await textOf(sandbox, 'git branch -vv')).toContain('[origin/x: gone]')
  })

  it('refuses a branch the remote does not have', async () => {
    const sandbox = await pushed()

    expect(await textOf(sandbox, 'git push origin --delete nope')).toBe(
      `error: unable to delete 'nope': remote ref does not exist\nerror: failed to push some refs to '${URL}'`,
    )
  })

  it('refuses the branch the remote has checked out', async () => {
    const sandbox = await pushed()

    expect(await textOf(sandbox, 'git push origin --delete main')).toBe(
      [
        `To ${URL}`,
        ' ! [remote rejected] main (refusing to delete the current branch: refs/heads/main)',
        `error: failed to push some refs to '${URL}'`,
      ].join('\n'),
    )
  })

  it('needs a name', async () => {
    const sandbox = await pushed()

    expect(await textOf(sandbox, 'git push origin --delete')).toBe("fatal: --delete doesn't make sense without any refs")
  })

  it('pushes again after deleting', async () => {
    const sandbox = await pushed()
    await sandbox.run('git push origin :x')

    expect(reportLines(await textOf(sandbox, 'git push origin HEAD'))).toEqual([`To ${URL}`, ' * [new branch]      HEAD -> x'])
  })
})

describe('more than one branch at once', () => {
  it('is refused with a course message', async () => {
    const sandbox = await onNewBranch('x')

    const result = await sandbox.run('git push origin main x')

    expect(result.outputs).toEqual([
      { stream: 'stderr', prose: true, text: 'This practice terminal pushes one branch at a time. Run git push once for each branch.' },
    ])
  })
})
