import { describe, expect, it } from 'vitest'
import { replaySandbox } from './replaySandbox'

describe('lesson 9: merge a finished branch', () => {
  it('explains a merge run from the branch that should have supplied the work', async () => {
    const result = await replaySandbox('merge-due-dates', ['git merge main'])

    expect(result.detour).toBe('merged-into-branch')
  })

  it('can still be finished after merging in the wrong direction', async () => {
    const result = await replaySandbox('merge-due-dates', [
      'git merge main',
      'git switch main',
      'git merge add-due-dates',
      'git branch -d add-due-dates',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 10: a conflict from start to finish', () => {
  it('explains conflict markers committed by mistake', async () => {
    const result = await replaySandbox('conflict-merge-walkthrough', [
      'git merge raise-limit',
      'git add settings.txt',
      'git commit -m "Merge raise-limit"',
    ])

    expect(result.detour).toBe('markers-committed')
  })

  it('finishes after an abort and a second attempt', async () => {
    const result = await replaySandbox('conflict-merge-walkthrough', [
      'git merge raise-limit',
      'git merge --abort',
      'git merge raise-limit',
      'echo "MAX_TASKS = 15" > settings.txt',
      'git add settings.txt',
      'git commit -m "Merge raise-limit"',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 11: shelve it, fix it, take it back', () => {
  it('explains a fix commit that swept up the unfinished search work', async () => {
    const result = await replaySandbox('stash-round-trip', [
      'echo "MAX_TASKS = 10" > settings.txt',
      'git add .',
      'git commit -m "fix: allow tasks again"',
    ])

    expect(result.detour).toBe('fix-swept-search')
  })

  it('takes untracked files in one go with -u', async () => {
    const result = await replaySandbox('stash-round-trip', [
      'git stash -u',
      'echo "MAX_TASKS = 10" > settings.txt',
      'git add settings.txt',
      'git commit -m "fix: allow tasks again"',
      'git stash pop',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 12: tidy up after a mistake', () => {
  it('explains a third commit made instead of an amend', async () => {
    const result = await replaySandbox('fix-the-last-commit', [
      'git add search-help.txt',
      'git commit -m "feat: add search help"',
    ])

    expect(result.detour).toBe('extra-commit')
  })

  it('explains the trial limit folded into the amended commit', async () => {
    const result = await replaySandbox('fix-the-last-commit', ['git add .', 'git commit --amend -m "feat: add search"'])

    expect(result.detour).toBe('settings-folded')
  })

  it('accepts fixing the message and the file in two amends', async () => {
    const result = await replaySandbox('fix-the-last-commit', [
      'git commit --amend -m "feat: add search"',
      'git add search-help.txt',
      'git commit --amend --no-edit',
      'git restore settings.txt',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})
