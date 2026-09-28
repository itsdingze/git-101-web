import { describe, expect, it } from 'vitest'
import { replaySandbox } from './replaySandbox'

describe('lesson 1: find your feet', () => {
  it('explains a plan written inside notes instead of at the top', async () => {
    const result = await replaySandbox('find-your-feet', ['cd notes', 'echo "Add search" > plan.txt'])

    expect(result.completed[0]).toBe(false)
    expect(result.detour).toBe('plan-in-notes')
  })

  it('recovers once the plan is written at the top', async () => {
    const result = await replaySandbox('find-your-feet', [
      'cd notes',
      'echo "Add search" > plan.txt',
      'cd ..',
      'echo "Add search" > plan.txt',
    ])

    expect(result.completed[0]).toBe(true)
    expect(result.detour).toBeNull()
  })

  it('waits for >> when the second line replaced the first with >', async () => {
    const result = await replaySandbox('find-your-feet', ['echo "Add search" > plan.txt', 'echo "Add tags" > plan.txt'])

    expect(result.completed).toEqual([true, false])
  })
})

describe('lesson 2: sign your work', () => {
  it('suggests a real name when the placeholder is copied literally', async () => {
    const result = await replaySandbox('sign-your-work', ['git config --global user.name "Your Name"'])

    expect(result.completed[0]).toBe(false)
    expect(result.detour).toBe('placeholder-name')
  })

  it('does not finish on the placeholder name, even with the email set first', async () => {
    const result = await replaySandbox('sign-your-work', [
      'git config --global user.email "ada@example.com"',
      'git config --global user.name "Your Name"',
    ])

    expect(result.completed[1]).toBe(false)
    expect(result.detour).toBe('placeholder-name')
  })

  it('finishes once the placeholder is replaced with a real name', async () => {
    const result = await replaySandbox('sign-your-work', [
      'git config --global user.name "Your Name"',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email "ada@example.com"',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 3: turn a folder into a repository', () => {
  it('explains a repository made in the folder above todo-app', async () => {
    const result = await replaySandbox('first-repository-walkthrough', ['cd ..', 'git init'])

    expect(result.completed).toEqual([false, false])
    expect(result.detour).toBe('repo-above-project')
  })

  it('explains a repository made in a new folder inside todo-app', async () => {
    const result = await replaySandbox('first-repository-walkthrough', ['git init todo-app'])

    expect(result.completed[0]).toBe(false)
    expect(result.detour).toBe('repo-nested-inside-project')
  })

  it('recovers from the nested repository once it is removed and git init runs in todo-app', async () => {
    const result = await replaySandbox('first-repository-walkthrough', ['git init todo-app', 'rm -r todo-app', 'git init'])

    expect(result.completed[0]).toBe(true)
    expect(result.detour).toBeNull()
  })
})

describe('lesson 4: first commit loop', () => {
  it('completes when the files are committed one at a time', async () => {
    const result = await replaySandbox('first-commit-loop', [
      'git add app.txt',
      'git commit -m "feat: add task list"',
      'git add settings.txt',
      'git commit -m "feat: add settings"',
      'echo "MAX_TASKS = 20" > settings.txt',
      'git add settings.txt',
      'git commit -m "feat: raise the task limit"',
    ])

    expect(result.completed).toEqual([true, true, true])
  })

  it('accepts the edit commit whatever its message says', async () => {
    const result = await replaySandbox('first-commit-loop', [
      'git add .',
      'git commit -m "Initial commit"',
      'echo "show(tasks)" > app.txt',
      'git add app.txt',
      'git commit -m "simplify app"',
    ])

    expect(result.completed).toEqual([true, true, true])
  })

  it('does not count committing a second new file as the edit', async () => {
    const result = await replaySandbox('first-commit-loop', [
      'git add app.txt',
      'git commit -m "feat: add task list"',
      'git add settings.txt',
      'git commit -m "feat: add settings"',
    ])

    expect(result.completed).toEqual([true, true, false])
  })
})
