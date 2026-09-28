import { describe, expect, it } from 'vitest'
import { replaySandbox } from './replaySandbox'

describe('lesson 5: review before commit', () => {
  it('waits for the commit once the change is staged', async () => {
    const result = await replaySandbox('review-before-commit', [
      'echo "MAX_TASKS = 25" > settings.txt',
      'git add settings.txt',
    ])

    expect(result.completed).toEqual([true, false])
  })
})

describe('lesson 6: keep the junk out', () => {
  it('explains a second rule written with > that wiped the first', async () => {
    const result = await replaySandbox('ignore-rules-in-practice', [
      'echo ".env" > .gitignore',
      'echo "*.log" > .gitignore',
    ])

    expect(result.detour).toBe('rules-overwritten')
  })

  it('recovers once the lost rule is added back with >>', async () => {
    const result = await replaySandbox('ignore-rules-in-practice', [
      'echo ".env" > .gitignore',
      'echo "*.log" > .gitignore',
      'echo ".env" >> .gitignore',
    ])

    expect(result.detour).toBeNull()
  })

  it('explains a .env committed before any rule existed', async () => {
    const result = await replaySandbox('ignore-rules-in-practice', ['git add .', 'git commit -m "feat: add task list"'])

    expect(result.detour).toBe('env-committed')
  })
})

describe('lesson 7: untrack a file', () => {
  it('explains plain git rm, which deletes debug.log from the folder', async () => {
    const result = await replaySandbox('stop-tracking-log', ['git rm debug.log'])

    expect(result.detour).toBe('log-deleted')
  })

  it('waits for the commit after untracking', async () => {
    const result = await replaySandbox('stop-tracking-log', ['git rm --cached debug.log'])

    expect(result.completed).toEqual([true, false])
    expect(result.detour).toBeNull()
  })
})

describe('lesson 8: branch isolation', () => {
  it('explains a commit that landed on main because the branch was never switched to', async () => {
    const result = await replaySandbox('branch-isolation-walkthrough', [
      'git branch add-due-dates',
      'git add dates.txt',
      'git commit -m "feat: add due dates"',
      'git switch add-due-dates',
    ])

    expect(result.detour).toBe('dates-committed-on-main')
  })

  it('accepts the older checkout -b form', async () => {
    const result = await replaySandbox('branch-isolation-walkthrough', [
      'git checkout -b add-due-dates',
      'git add .',
      'git commit -m "feat: add due dates"',
      'git switch main',
      'git switch add-due-dates',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})
