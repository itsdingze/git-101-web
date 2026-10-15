import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { lessons } from '@/data/lessons'
import { replaySandbox } from './replaySandbox'
import { SOLUTIONS, type SolutionStep } from './solutions'

const prefixesOf = (lines: readonly SolutionStep[]) => lines.map((_, index) => lines.slice(0, index + 1))

describe.each(['one-change-per-commit', 'branch-and-merge', 'undo-a-layout', 'fix-the-last-commit', 'read-your-history'])(
  'the happy path through %s',
  (stepId) => {
    it('never shows a detour on the way', async () => {
      for (const prefix of prefixesOf(SOLUTIONS[stepId] ?? [])) {
        const result = await replaySandbox(stepId, prefix)

        expect(result.detour, JSON.stringify(prefix[prefix.length - 1])).toBeNull()
      }
    }, 30_000)
  },
)

const UNTRACKED = ['git rm --cached debug.log', 'git status']
const CHORE = [...UNTRACKED, 'git add .gitignore', 'git commit -m "chore: stop tracking debug.log"']
const FEAT = [...CHORE, 'git add app.py dates.py', 'git commit -m "feat: add due dates"']

describe('lesson 4: one change per commit', () => {
  it('lets Git refuse a plain git rm, which would delete the file', async () => {
    const result = await replaySandbox('one-change-per-commit', ['git rm debug.log'])

    expect(result.failures).toHaveLength(1)
    expect(result.completed).toEqual([false, false, false, false])
    expect(result.detour).toBeNull()
  })

  it('explains a forced git rm that deleted debug.log from the folder', async () => {
    const result = await replaySandbox('one-change-per-commit', ['git rm -f debug.log'])

    expect(result.completed[0]).toBe(false)
    expect(result.detour).toBe('debug-log-deleted')
  })

  it('explains everything staged at once with git add .', async () => {
    const result = await replaySandbox('one-change-per-commit', ['git add .'])

    expect(result.detour).toBe('changes-mixed-staged')
  })

  it('explains everything swept into one commit', async () => {
    const result = await replaySandbox('one-change-per-commit', [...UNTRACKED, 'git add .', 'git commit -m "chore: tidy up"'])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('changes-mixed')
  })

  it('explains the rule committed while debug.log is still tracked', async () => {
    const result = await replaySandbox('one-change-per-commit', ['git add .gitignore', 'git commit -m "chore: ignore logs"'])

    expect(result.completed).toEqual([false, false, false, false])
    expect(result.detour).toBe('debug-log-still-tracked')
  })

  it('explains the removal committed without the rule', async () => {
    const result = await replaySandbox('one-change-per-commit', [...UNTRACKED, 'git commit -m "chore: stop tracking debug.log"'])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('rule-left-out')
  })

  it('finishes once the left-out rule gets its own commit', async () => {
    const result = await replaySandbox('one-change-per-commit', [
      ...UNTRACKED,
      'git commit -m "chore: stop tracking debug.log"',
      'git add .gitignore',
      'git commit -m "chore: ignore log files"',
      'git add app.py dates.py',
      'git commit -m "feat: add due dates"',
      'git add README.md',
      'git commit -m "docs: add a README"',
      'git status',
    ])

    expect(result.completed).toEqual([true, true, true, true])
    expect(result.detour).toBeNull()
  })

  it('explains due dates committed together with the README', async () => {
    const result = await replaySandbox('one-change-per-commit', [
      ...CHORE,
      'git add app.py dates.py README.md',
      'git commit -m "feat: add due dates"',
    ])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBe('changes-mixed')
  })

  it('waits for the docs commit when only due dates are committed', async () => {
    const result = await replaySandbox('one-change-per-commit', [...FEAT, 'git status'])

    expect(result.completed).toEqual([true, true, true, false])
    expect(result.detour).toBeNull()
  })

  it('waits for a look at git status after the last commit', async () => {
    const result = await replaySandbox('one-change-per-commit', [...FEAT, 'git add README.md', 'git commit -m "docs: add a README"'])

    expect(result.completed).toEqual([true, true, true, false])
  })
})

const SEARCH = ['git switch -c add-search', 'git add search.py app.py', 'git commit -m "feat: add search"']
const FIX = ['git switch main', 'git add dates.py', 'git commit -m "fix: hide due dates on finished tasks"']

describe('lesson 5: branch and merge', () => {
  it('explains search committed on main', async () => {
    const result = await replaySandbox('branch-and-merge', ['git add search.py app.py', 'git commit -m "feat: add search"'])

    expect(result.completed).toEqual([false, false, false, false, false, false])
    expect(result.detour).toBe('search-on-main')
  })

  it('does not count search committed on main before the branch was made', async () => {
    const result = await replaySandbox('branch-and-merge', [
      'git add search.py app.py',
      'git commit -m "feat: add search"',
      'git switch -c add-search',
    ])

    expect(result.completed).toEqual([true, false, false, false, false, false])
    expect(result.detour).toBe('search-on-main')
  })

  it('explains the fix committed together with search', async () => {
    const result = await replaySandbox('branch-and-merge', ['git switch -c add-search', 'git add .', 'git commit -m "feat: add search"'])

    expect(result.completed).toEqual([true, false, false, false, false, false])
    expect(result.detour).toBe('fix-on-search-branch')
  })

  it('explains the fix committed on add-search after search', async () => {
    const result = await replaySandbox('branch-and-merge', [
      ...SEARCH,
      'git add dates.py',
      'git commit -m "fix: hide due dates on finished tasks"',
    ])

    expect(result.completed).toEqual([true, true, false, false, false, false])
    expect(result.detour).toBe('fix-on-search-branch')
  })

  it('explains main merged into add-search', async () => {
    const result = await replaySandbox('branch-and-merge', [...SEARCH, ...FIX, 'git switch add-search', 'git merge main'])

    expect(result.completed).toEqual([true, true, true, false, false, false])
    expect(result.detour).toBe('merged-into-branch')
  })

  it('does not count a merge back into main after the wrong-way merge', async () => {
    const result = await replaySandbox('branch-and-merge', [
      ...SEARCH,
      ...FIX,
      'git switch add-search',
      'git merge main',
      'git switch main',
      'git merge add-search',
    ])

    expect(result.completed).toEqual([true, true, true, false, false, false])
    expect(result.detour).toBe('merged-into-branch')
  })

  it('waits for the merge before the branch can be deleted', async () => {
    const result = await replaySandbox('branch-and-merge', [...SEARCH, ...FIX, 'git branch -D add-search'])

    expect(result.completed).toEqual([true, true, true, false, false, false])
  })

  it('accepts the graph flags in either order', async () => {
    const result = await replaySandbox('branch-and-merge', [
      ...SEARCH,
      ...FIX,
      'git merge add-search',
      'git branch -d add-search',
      'git log --graph --oneline',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 6: undo a layout', () => {
  it('accepts restoring app.py by name', async () => {
    const result = await replaySandbox('undo-a-layout', ['git status', 'git restore app.py', 'git status'])

    expect(result.completed).toEqual([true, true, true])
  })

  it('waits for a look at git status after the restore', async () => {
    const result = await replaySandbox('undo-a-layout', ['git status', 'git restore .'])

    expect(result.completed).toEqual([true, true, false])
  })

  it('explains a staged grid that restoring every file leaves alone', async () => {
    const result = await replaySandbox('undo-a-layout', ['git status', 'git add app.py', 'git restore .'])

    expect(result.completed).toEqual([true, false, false])
    expect(result.detour).toBe('grid-staged')
  })

  it('finishes once the staged grid is unstaged and restored', async () => {
    const result = await replaySandbox('undo-a-layout', [
      'git status',
      'git add app.py',
      'git restore --staged app.py',
      'git restore .',
      'git status',
    ])

    expect(result.completed).toEqual([true, true, true])
    expect(result.detour).toBeNull()
  })

  it('explains the grid layout committed instead of thrown away', async () => {
    const result = await replaySandbox('undo-a-layout', ['git status', 'git add app.py', 'git commit -m "feat: grid layout"'])

    expect(result.completed).toEqual([true, false, false])
    expect(result.detour).toBe('grid-committed')
  })
})

describe('lesson 6: fix the last commit', () => {
  it('explains an amend run before the file was staged', async () => {
    const result = await replaySandbox('fix-the-last-commit', ['git commit --amend -m "feat: add priorities"'])

    expect(result.completed).toEqual([false, false])
    expect(result.detour).toBe('amended-before-add')
  })

  it('finishes once the file is staged and the commit amended again', async () => {
    const result = await replaySandbox('fix-the-last-commit', [
      'git commit --amend -m "feat: add priorities"',
      'git add priority.py',
      'git commit --amend -m "feat: add priorities"',
      'git log --oneline',
    ])

    expect(result.completed).toEqual([true, true])
    expect(result.detour).toBeNull()
  })

  it('explains a second priorities commit instead of an amend', async () => {
    const result = await replaySandbox('fix-the-last-commit', [
      'git add priority.py',
      'git commit -m "feat: add priorities"',
      'git log --oneline',
    ])

    expect(result.completed).toEqual([true, false])
    expect(result.detour).toBe('extra-commit')
  })

  it('does not count an amend that kept the typo', async () => {
    const result = await replaySandbox('fix-the-last-commit', [
      'git add priority.py',
      'git commit --amend --no-edit',
      'git log --oneline',
    ])

    expect(result.completed).toEqual([true, false])
  })

  it('waits for a look at the log after the amend', async () => {
    const result = await replaySandbox('fix-the-last-commit', ['git add priority.py', 'git commit --amend -m "feat: add priorities"'])

    expect(result.completed).toEqual([true, false])
  })
})

describe('lesson 7: read your history', () => {
  it('accepts git show with HEAD~2 for the fix commit', async () => {
    const result = await replaySandbox('read-your-history', [
      'git log --oneline',
      'git show HEAD~2',
      'git diff',
      'git add app.py',
      'git commit -m "feat: sort tasks by due date"',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
  })

  it('counts git show only for the fix commit', async () => {
    const step = lessons.flatMap((lesson) => lesson.steps).find((entry) => entry.id === 'read-your-history')
    if (step?.type !== 'sandbox-exercise') throw new Error('no read-your-history sandbox')
    const commits = (await (await createSandbox(step.seed)).snapshot()).commits
    const shortHash = (subject: string) => commits.find((commit) => commit.message.startsWith(subject))!.oid.slice(0, 7)

    const plain = await replaySandbox('read-your-history', ['git log --oneline', 'git show'])
    const priorities = await replaySandbox('read-your-history', ['git log --oneline', `git show ${shortHash('feat: add priorities')}`])
    const fix = await replaySandbox('read-your-history', ['git log --oneline', `git show ${shortHash('fix: hide due dates')}`])

    expect(plain.completed[1]).toBe(false)
    expect(priorities.completed[1]).toBe(false)
    expect(fix.completed[1]).toBe(true)
  })

  it('does not count the full log as the one-line log', async () => {
    const result = await replaySandbox('read-your-history', ['git log'])

    expect(result.completed[0]).toBe(false)
  })

  it('waits for the commit after git diff', async () => {
    const result = await replaySandbox('read-your-history', ['git log --oneline', 'git show HEAD~2', 'git diff', 'git add app.py'])

    expect(result.completed).toEqual([true, true, true, false])
  })

  it('does not count git diff run after app.py was staged', async () => {
    const result = await replaySandbox('read-your-history', ['git log --oneline', 'git show HEAD~2', 'git add app.py', 'git diff'])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBe('staged-before-diff')
  })

  it('counts git diff once app.py is unstaged again', async () => {
    const result = await replaySandbox('read-your-history', [
      'git log --oneline',
      'git show HEAD~2',
      'git add app.py',
      'git restore --staged app.py',
      'git diff',
    ])

    expect(result.completed).toEqual([true, true, true, false])
    expect(result.detour).toBeNull()
  })

  it('explains a commit made before looking with git diff', async () => {
    const result = await replaySandbox('read-your-history', [
      'git log --oneline',
      'git show HEAD~2',
      'git add app.py',
      'git commit -m "feat: sort tasks by due date"',
      'git diff',
    ])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBe('committed-before-diff')
  })

  it('explains a commit without a feat: message', async () => {
    const result = await replaySandbox('read-your-history', [
      'git log --oneline',
      'git show HEAD~2',
      'git diff',
      'git add app.py',
      'git commit -m "fix: sort tasks by due date"',
    ])

    expect(result.completed).toEqual([true, true, true, false])
    expect(result.detour).toBe('not-a-feature')
  })

  it('finishes once the message is amended', async () => {
    const result = await replaySandbox('read-your-history', [
      'git log --oneline',
      'git show HEAD~2',
      'git diff',
      'git add app.py',
      'git commit -m "fix: sort tasks by due date"',
      'git commit --amend -m "feat: sort tasks by due date"',
    ])

    expect(result.completed).toEqual([true, true, true, true])
    expect(result.detour).toBeNull()
  })
})
