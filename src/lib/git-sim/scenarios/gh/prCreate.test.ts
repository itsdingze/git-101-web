import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'
import { exportBranch, openExportPullRequest, PULL_URL, pushedExportBranch, teamSeed } from './pullRequestFixtures'

describe('gh pr create', () => {
  it('opens a pull request for the pushed branch and prints its address', async () => {
    const sandbox = await pushedExportBranch()

    const result = await sandbox.run('gh pr create --title "feat: add export" --body "Saves the task list to a file."')

    expect(result.outputs).toEqual([
      {
        stream: 'stdout',
        text: ['Creating pull request for add-export into main in your-username/todo-app', '', PULL_URL].join('\n'),
      },
    ])
    expect(evaluateGoal({ kind: 'pr-open', branch: 'add-export' }, await sandbox.snapshot())).toBe(true)
    expect(evaluateGoal({ kind: 'pr-open' }, await sandbox.snapshot())).toBe(true)
    expect(evaluateGoal({ kind: 'pr-open', branch: 'main' }, await sandbox.snapshot())).toBe(false)
  })

  it('refuses a branch that is not on GitHub yet', async () => {
    const sandbox = await exportBranch()

    expect(await textOf(sandbox, 'gh pr create --title "feat: add export" --body "Export"')).toBe(
      'aborted: you must first push the current branch to a remote, or use the --head flag',
    )
    expect(evaluateGoal({ kind: 'pr-open' }, await sandbox.snapshot())).toBe(false)
  })

  it('refuses a branch with commits GitHub does not have yet', async () => {
    const sandbox = await pushedExportBranch()
    await sandbox.run('echo "more" >> export.txt')
    await sandbox.run('git commit -am "feat: export more"')

    expect(await textOf(sandbox, 'gh pr create --fill')).toBe(
      'aborted: you must first push the current branch to a remote, or use the --head flag',
    )
  })

  it('needs a title and body, or --fill', async () => {
    const sandbox = await pushedExportBranch()

    expect(await textOf(sandbox, 'gh pr create --title "feat: add export"')).toBe(
      'must provide `--title` and `--body` (or `--fill` or `fill-first` or `--fillverbose`) when not running interactively',
    )
  })

  it('fills the title and body from a single commit with --fill', async () => {
    const sandbox = await pushedExportBranch()
    await sandbox.run('gh pr create --fill')

    expect((await textOf(sandbox, 'gh pr view')).split('\n')[0]).toBe('feat: add export your-username/todo-app#1')
  })

  it('names the pull request after the branch and lists the commits when there are several', async () => {
    const sandbox = await exportBranch()
    await sandbox.run('echo "csv" >> export.txt')
    await sandbox.run('git commit -am "feat: export as csv"')
    await sandbox.run('git push -u origin add-export')
    await sandbox.run('gh pr create --fill')

    const view = await textOf(sandbox, 'gh pr view')
    expect(view.split('\n')[0]).toBe('add export your-username/todo-app#1')
    expect(view).toContain('  - **feat: add export**\n  - **feat: export as csv**')
  })

  it('refuses a second pull request for the same branch', async () => {
    const sandbox = await openExportPullRequest()

    expect(await textOf(sandbox, 'gh pr create --fill')).toBe(
      `a pull request for branch "add-export" into branch "main" already exists:\n${PULL_URL}`,
    )
  })

  it('refuses a pull request from main into main', async () => {
    const sandbox = await createSandbox(teamSeed())

    expect(await textOf(sandbox, 'gh pr create --fill')).toBe('GraphQL: No commits between main and main (createPullRequest)')
  })

  it('prints only what gh prints when Sam approves straight away, and shows the approval in gh pr view', async () => {
    const sandbox = await pushedExportBranch(true)

    expect(await textOf(sandbox, 'gh pr create --fill')).toBe(
      ['Creating pull request for add-export into main in your-username/todo-app', '', PULL_URL].join('\n'),
    )
    expect(await textOf(sandbox, 'gh pr view')).toContain('Reviewers: sam-rivera (Approved)')
  })
})
