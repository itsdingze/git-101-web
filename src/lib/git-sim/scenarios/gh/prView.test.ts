import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'
import { openExportPullRequest, PULL_URL, teamSeed } from './pullRequestFixtures'

describe('gh pr view', () => {
  it("shows the current branch's pull request like gh does in a terminal", async () => {
    const sandbox = await openExportPullRequest()

    expect(await textOf(sandbox, 'gh pr view')).toBe(
      [
        'feat: add export your-username/todo-app#1',
        'Open • your-username wants to merge 1 commit into main from add-export • less than a minute ago',
        '+2 -0',
        '',
        '  Saves the task list to a file.',
        '',
        `View this pull request on GitHub: ${PULL_URL}`,
      ].join('\n'),
    )
  })

  it("shows Sam's approval once Sam has reviewed it", async () => {
    const sandbox = await openExportPullRequest(true)

    expect((await textOf(sandbox, 'gh pr view')).split('\n')[3]).toBe('Reviewers: sam-rivera (Approved)')
  })

  it('finds a pull request by number or by branch from anywhere in the repository', async () => {
    const sandbox = await openExportPullRequest()
    await sandbox.run('git switch main')

    expect((await textOf(sandbox, 'gh pr view 1')).split('\n')[0]).toBe('feat: add export your-username/todo-app#1')
    expect((await textOf(sandbox, 'gh pr view add-export')).split('\n')[0]).toBe('feat: add export your-username/todo-app#1')
  })

  it('says when the branch has no pull request', async () => {
    const sandbox = await createSandbox(teamSeed())

    expect(await textOf(sandbox, 'gh pr view')).toBe('no pull requests found for branch "main"')
  })

  it('says when the number has no pull request', async () => {
    const sandbox = await createSandbox(teamSeed())

    expect(await textOf(sandbox, 'gh pr view 7')).toBe(
      'GraphQL: Could not resolve to a PullRequest with the number of 7. (repository.pullRequest)',
    )
  })

  it('says "No description provided" for an empty body', async () => {
    const sandbox = await openExportPullRequest()
    await sandbox.run('git switch -c add-print main')
    await sandbox.run('echo "print(tasks)" > print.txt')
    await sandbox.run('git add .')
    await sandbox.run('git commit -m "feat: add print"')
    await sandbox.run('git push -u origin add-print')
    await sandbox.run('gh pr create --title "feat: add print" --body ""')

    expect(await textOf(sandbox, 'gh pr view')).toContain('\n\n  No description provided\n\n')
  })
})
