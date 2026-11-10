import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox } from '@/lib/git-sim/createSandbox'
import { COMMITTED_SEED } from '@/lib/git-sim/scenarios/goalFixtures'
import { textOf } from '@/lib/git-sim/scenarios/textOf'
import type { CommandOutput } from '@/lib/git-sim/types'

const REMOTE_URL = 'https://github.com/team/project.git'

function refusal(option: string, command: string): CommandOutput[] {
  return [
    {
      stream: 'stderr',
      prose: true,
      text: `This practice terminal doesn't simulate ${option} for git ${command}. Check the spelling, or run the command without it.`,
    },
  ]
}

async function remoteSandbox(): Promise<Sandbox> {
  return createSandbox({
    dir: 'project',
    remote: {
      name: 'origin',
      url: REMOTE_URL,
      setup: [{ write: { 'f.txt': 'one\n' } }, { run: 'git add .' }, { run: 'git commit -q -m "Initial commit"' }],
    },
  })
}

describe('options a git command does not simulate', () => {
  it('stop git log with a course message', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect((await sandbox.run('git log --onelin')).outputs).toEqual(refusal('--onelin', 'log'))
  })

  it('stop git diff with a course message', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect((await sandbox.run('git diff -staged')).outputs).toEqual(refusal('-staged', 'diff'))
  })

  it('leave the options the course teaches alone', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git log --oneline --graph -3')).toContain('Initial commit')
    expect(await textOf(sandbox, 'git log --oneline -n 1 --all')).toContain('Initial commit')
    expect(await textOf(sandbox, 'git diff --staged')).toBe('')
    expect(await textOf(sandbox, 'git diff --cached -- index.html')).toBe('')
  })

  it.each([
    ['git add --nope f', '--nope', 'add'],
    ['git add -p', '-p', 'add'],
    ['git branch --nope', '--nope', 'branch'],
    ['git clone --nope x', '--nope', 'clone'],
    ['git commit --nope', '--nope', 'commit'],
    ['git config --nope a.b', '--nope', 'config'],
    ['git init --nope', '--nope', 'init'],
    ['git merge --nope x', '--nope', 'merge'],
    ['git pull --nope', '--nope', 'pull'],
    ['git push --nope', '--nope', 'push'],
    ['git remote --nope', '--nope', 'remote'],
    ['git restore --nope f', '--nope', 'restore'],
    ['git restore -p f', '-p', 'restore'],
    ['git rm --nope f', '--nope', 'rm'],
    ['git show --nope', '--nope', 'show'],
    ['git stash --nope', '--nope', 'stash'],
    ['git stash push -p', '-p', 'stash'],
    ['git status --nope', '--nope', 'status'],
    ['git switch --nope', '--nope', 'switch'],
    ['git switch --detach', '--detach', 'switch'],
    ['git merge -s ours x', '-s', 'merge'],
    ['git merge -X ours x', '-X', 'merge'],
  ])('refuse %s and do nothing', async (line, option, command) => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    const before = await sandbox.snapshot()

    expect((await sandbox.run(line)).outputs).toEqual(refusal(option, command))

    const after = await sandbox.snapshot()
    expect(after.commits).toEqual(before.commits)
    expect(after.staged).toEqual(before.staged)
    expect(after.unstaged).toEqual(before.unstaged)
  })

  it('never pushes when an option is unknown', async () => {
    const sandbox = await remoteSandbox()
    await sandbox.run('git switch -c feature')
    await sandbox.writeFile('a.txt', 'a\n')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m a')

    await sandbox.run('git push --nope origin feature')

    expect(await textOf(sandbox, 'git branch -r')).not.toContain('feature')
  })

  it('still reads a bundled commit message', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)
    await sandbox.writeFile('index.html', 'changed\n')

    await sandbox.run('git commit -am "bundled"')

    expect(await textOf(sandbox, 'git log --oneline -1')).toContain('bundled')
  })

  it('reports a value option left without its value', async () => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect(await textOf(sandbox, 'git switch -c')).toBe("error: switch `c' requires a value")
    expect(await textOf(sandbox, 'git commit --message')).toBe("error: option `message' requires a value")
  })
})

describe('real commands the terminal does not simulate', () => {
  it.each([['ls-files'], ['check-ignore'], ['rev-parse'], ['grep']])('names git %s', async (name) => {
    const sandbox = await createSandbox(COMMITTED_SEED)

    expect((await sandbox.run(`git ${name}`)).outputs).toEqual([
      { stream: 'stderr', prose: true, text: `git ${name} is a real Git command, but this practice sandbox doesn't simulate it.` },
    ])
  })

  it.each([['pr list'], ['pr status'], ['repo create'], ['issue list']])('names gh %s', async (name) => {
    const sandbox = await createSandbox({ ...COMMITTED_SEED, github: { signedIn: true } })

    expect((await sandbox.run(`gh ${name}`)).outputs).toEqual([
      { stream: 'stderr', prose: true, text: `gh ${name} is a real GitHub CLI command, but this practice sandbox doesn't simulate it.` },
    ])
  })
})
