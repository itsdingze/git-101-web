import { describe, expect, it } from 'vitest'
import { replaySandbox } from './replaySandbox'

const TEAM_URL = 'https://github.com/study-group/todo-app.git'

describe('lesson 13: clone the team project', () => {
  it('explains a clone made inside a folder already called todo-app', async () => {
    const result = await replaySandbox('clone-the-team-project', ['mkdir todo-app', 'cd todo-app', `git clone ${TEAM_URL}`])

    expect(result.completed[0]).toBe(false)
    expect(result.detour).toBe('clone-nested')
  })

  it('recovers once the outer folder is removed and the clone lands in the home folder', async () => {
    const result = await replaySandbox('clone-the-team-project', [
      'mkdir todo-app',
      'cd todo-app',
      `git clone ${TEAM_URL}`,
      'cd ~',
      'rm -r todo-app',
      `git clone ${TEAM_URL}`,
    ])

    expect(result.completed[0]).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 14: a refused push', () => {
  it('does not count the push that Git refuses', async () => {
    const result = await replaySandbox('remote-round-trip', ['git add tags.txt', 'git commit -m "feat: add tags"', 'git push'])

    expect(result.completed).toEqual([true, false, false])
  })

  it('also accepts pull with the remote and branch named', async () => {
    const result = await replaySandbox('remote-round-trip', [
      'git add tags.txt',
      'git commit -m "feat: add tags"',
      'git pull origin main',
    ])

    expect(result.completed[1]).toBe(true)
  })

  it('finishes when the learner pulls before committing', async () => {
    const result = await replaySandbox('remote-round-trip', [
      'git pull',
      'git add tags.txt',
      'git commit -m "feat: add tags"',
      'git push',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
  })
})

describe('lesson 15: connect a project', () => {
  it('explains a push without -u', async () => {
    const result = await replaySandbox('connect-new-project', [
      'git remote add origin https://github.com/you/todo-app.git',
      'git push origin main',
    ])

    expect(result.detour).toBe('pushed-without-u')
  })

  it('finishes once -u pairs the branch', async () => {
    const result = await replaySandbox('connect-new-project', [
      'git remote add origin https://github.com/you/todo-app.git',
      'git push origin main',
      'git push -u origin main',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 16: the team loop', () => {
  it('explains a commit made on main', async () => {
    const result = await replaySandbox('feature-branch-workflow-practice', [
      'git pull',
      'git add .',
      'git commit -m "feat: add export"',
    ])

    expect(result.detour).toBe('committed-on-main')
  })

  it('explains a branch cut from the stale main', async () => {
    const result = await replaySandbox('feature-branch-workflow-practice', [
      'git switch -c add-export',
      'git add .',
      'git commit -m "feat: add export"',
    ])

    expect(result.detour).toBe('stale-branch')
  })

  it('recovers by pulling main into the branch', async () => {
    const result = await replaySandbox('feature-branch-workflow-practice', [
      'git switch -c add-export',
      'git add .',
      'git commit -m "feat: add export"',
      'git pull origin main',
      'git push -u origin add-export',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 17: undo a commit by adding one', () => {
  it('explains a revert of the wrong commit', async () => {
    const result = await replaySandbox('revert-a-bad-commit', ['git revert HEAD~1'])

    expect(result.detour).toBe('reverted-wrong-commit')
  })

  it('recovers by reverting the revert, then the dark mode commit', async () => {
    const result = await replaySandbox('revert-a-bad-commit', ['git revert HEAD~1', 'git revert HEAD', 'git revert HEAD~2'])

    expect(result.completed).toEqual([true, false])
    expect(result.detour).toBeNull()
  })

  it('does not count the undo as shared until it is pushed', async () => {
    const result = await replaySandbox('revert-a-bad-commit', ['git revert HEAD'])

    expect(result.completed).toEqual([true, false])
  })
})

describe('lesson 20: lose a commit, then bring it back', () => {
  it('does not count a soft reset as losing the work', async () => {
    const result = await replaySandbox('reflog-rescue', [
      'git add archive.txt',
      'git commit -m "feat: add archive"',
      'git reset --soft HEAD~1',
    ])

    expect(result.completed).toEqual([true, false, false])
  })
})

describe('lesson 21: look before you pull', () => {
  it('does not count the fetch as merging the commit', async () => {
    const result = await replaySandbox('fetch-then-pull', ['git fetch origin'])

    expect(result.completed).toEqual([true, false])
  })

  it('still finishes when the learner pulls without fetching first', async () => {
    const result = await replaySandbox('fetch-then-pull', ['git pull'])

    expect(result.completed).toEqual([true, true])
  })
})
