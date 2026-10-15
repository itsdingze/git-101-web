import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'
import { textOf } from '@/lib/git-sim/scenarios/textOf'
import { openExportPullRequest, teamSeed } from './pullRequestFixtures'

const MERGED = '✓ Merged pull request your-username/todo-app#1 (feat: add export)'

describe('gh pr merge', () => {
  it('needs the merge method spelled out', async () => {
    const sandbox = await openExportPullRequest()

    expect(await textOf(sandbox, 'gh pr merge')).toBe('--merge, --rebase, or --squash required when not running interactively')
    expect(evaluateGoal({ kind: 'pr-merged' }, await sandbox.snapshot())).toBe(false)
  })

  it('simulates only the merge method', async () => {
    const sandbox = await openExportPullRequest()

    expect(await textOf(sandbox, 'gh pr merge --squash')).toBe(
      'This practice terminal only simulates --merge. Run gh pr merge --merge',
    )
  })

  it("makes a merge commit on GitHub's main with GitHub's message", async () => {
    const sandbox = await openExportPullRequest()

    expect(await textOf(sandbox, 'gh pr merge --merge')).toBe(MERGED)
    const snapshot = await sandbox.snapshot()
    expect(evaluateGoal({ kind: 'pr-merged', branch: 'add-export' }, snapshot)).toBe(true)
    expect(evaluateGoal({ kind: 'pr-open' }, snapshot)).toBe(false)

    await sandbox.run('git switch main')
    await sandbox.run('git pull')
    const merge = (await sandbox.snapshot()).commits.find((commit) => commit.message.startsWith('Merge pull request'))
    expect(merge?.message).toBe('Merge pull request #1 from your-username/add-export\n\nfeat: add export')
    expect(merge?.parents).toHaveLength(2)
    expect(await textOf(sandbox, 'git log --oneline -1')).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main, origin\/main\) Merge pull request #1 from your-username\/add-export$/,
    )
  })

  it('makes a merge commit even when main has not moved', async () => {
    const sandbox = await openExportPullRequest()
    await sandbox.run('gh pr merge --merge')
    await sandbox.run('git switch main')
    await sandbox.run('git pull')

    expect(evaluateGoal({ kind: 'merge-commit-exists', onBranch: 'main' }, await sandbox.snapshot())).toBe(true)
  })

  it('with --delete-branch, moves you to main, pulls the merge, and deletes the branch here and on GitHub', async () => {
    const sandbox = await openExportPullRequest()

    const output = await textOf(sandbox, 'gh pr merge --merge --delete-branch')

    const lines = output.split('\n')
    expect(lines[0]).toBe(MERGED)
    expect(output).toContain("Switched to branch 'main'")
    expect(output).toContain('Fast-forward')
    expect(output).toMatch(/^Deleted branch add-export \(was [0-9a-f]{7}\)\.$/m)
    expect(lines.slice(-2)).toEqual([
      '✓ Deleted local branch add-export and switched to branch main',
      '✓ Deleted remote branch add-export',
    ])

    const snapshot = await sandbox.snapshot()
    expect(snapshot.branch).toBe('main')
    expect(snapshot.branches).toEqual(['main'])
    expect(evaluateGoal({ kind: 'up-to-date-with-remote', branch: 'main' }, snapshot)).toBe(true)
    expect(evaluateGoal({ kind: 'merge-commit-exists', onBranch: 'main' }, snapshot)).toBe(true)
    expect(await textOf(sandbox, 'git pull origin add-export')).toContain("fatal: couldn't find remote ref add-export")
  })

  it('says so when the pull request is already merged', async () => {
    const sandbox = await openExportPullRequest()
    await sandbox.run('gh pr merge --merge')

    expect(await textOf(sandbox, 'gh pr merge --merge')).toBe('! Pull request your-username/todo-app#1 was already merged')
  })

  it('says when the branch has no pull request', async () => {
    const sandbox = await createSandbox(teamSeed())

    expect(await textOf(sandbox, 'gh pr merge --merge')).toBe('no pull requests found for branch "main"')
  })
})
