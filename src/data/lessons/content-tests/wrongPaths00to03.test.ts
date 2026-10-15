import { describe, expect, it } from 'vitest'
import { replaySandbox } from './replaySandbox'

describe('lesson 1: find your way', () => {
  it('accepts going into recipes in one step', async () => {
    const result = await replaySandbox('find-your-way', ['pwd', 'ls', 'cd projects/recipes', 'ls', 'cd ..', 'cd ..'])

    expect(result.completed).toEqual([true, true, true, true, true])
  })

  it('accepts climbing back home in one step', async () => {
    const result = await replaySandbox('find-your-way', ['pwd', 'ls', 'cd projects', 'cd recipes', 'ls', 'cd ../..'])

    expect(result.completed).toEqual([true, true, true, true, true])
  })

  it('does not count listing projects as listing recipes', async () => {
    const result = await replaySandbox('find-your-way', ['pwd', 'ls', 'cd projects', 'ls'])

    expect(result.completed).toEqual([true, true, true, false, false])
  })

  it('does not count a cd into recipes from the home folder', async () => {
    const result = await replaySandbox('find-your-way', ['pwd', 'ls', 'cd recipes', 'ls'])

    expect(result.completed).toEqual([true, true, false, false, false])
  })

  it('waits for recipes to be listed before the way home counts', async () => {
    const result = await replaySandbox('find-your-way', ['pwd', 'ls', 'cd projects/recipes', 'cd ../..'])

    expect(result.completed).toEqual([true, true, true, false, false])
  })
})

describe('lesson 2: start the project', () => {
  it('explains a repository made in the home folder', async () => {
    const result = await replaySandbox('start-the-project', ['git init', 'cd projects/todo-app'])

    expect(result.completed).toEqual([true, false, false, false, false])
    expect(result.detour).toBe('repo-above-project')
  })

  it('keeps the repository goal open while the repository in the home folder stays (needs repo-above-project to see past todo-app/.git)', async () => {
    const result = await replaySandbox('start-the-project', ['git init', 'cd projects/todo-app', 'git init'])

    expect(result.completed).toEqual([true, false, false, false, false])
    expect(result.detour).toBe('repo-above-project')
  })

  it('explains a repository made in a new folder inside todo-app', async () => {
    const result = await replaySandbox('start-the-project', ['cd projects/todo-app', 'git init todo-app'])

    expect(result.completed).toEqual([true, false, false, false, false])
    expect(result.detour).toBe('repo-inside-project')
  })

  it('suggests a real name when the placeholder is copied literally', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.name "Your Name"',
    ])

    expect(result.completed).toEqual([true, true, false, false, false])
    expect(result.detour).toBe('placeholder-name')
  })

  it('finishes once the placeholder is replaced with a real name', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.name "Your Name"',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email "ada@example.com"',
      'git config --list',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })

  it.each(['user.nmae', 'user.nam', 'user.username'])('explains a name set under the misspelled key %s', async (key) => {
    const result = await replaySandbox('start-the-project', ['cd projects/todo-app', 'git init', `git config --global ${key} "Ada Lovelace"`])

    expect(result.completed).toEqual([true, true, false, false, false])
    expect(result.detour).toBe('misspelled-name-key')
  })

  it.each(['user.emial', 'user.mail', 'user.e-mail', 'user.emai'])(
    'explains an email set under the misspelled key %s',
    async (key) => {
      const result = await replaySandbox('start-the-project', [
        'cd projects/todo-app',
        'git init',
        'git config --global user.name "Ada Lovelace"',
        `git config --global ${key} "ada@example.com"`,
        'git config --list',
      ])

      expect(result.completed).toEqual([true, true, true, false, false])
      expect(result.detour).toBe('misspelled-email-key')
    },
  )

  it('explains a misspelled name key set after a name cut short', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.name Ada Lovelace',
      'git config --global user.nmae "Ada Lovelace"',
    ])

    expect(result.completed).toEqual([true, true, false, false, false])
    expect(result.detour).toBe('misspelled-name-key')
  })

  it('explains a misspelled email key once the misspelled name key is fixed', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.nmae "Ada Lovelace"',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.emial "ada@example.com"',
    ])

    expect(result.completed).toEqual([true, true, true, false, false])
    expect(result.detour).toBe('misspelled-email-key')
  })

  it('finishes once the misspelled keys are set again correctly', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.nmae "Ada Lovelace"',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.emial "ada@example.com"',
      'git config --global user.email "ada@example.com"',
      'git config --list',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })

  it('explains a name cut short to its first word', async () => {
    const result = await replaySandbox('start-the-project', ['cd projects/todo-app', 'git init', 'git config --global user.name Ada Lovelace'])

    expect(result.completed).toEqual([true, true, false, false, false])
    expect(result.detour).toBe('name-cut-short')
  })

  it('finishes once the full name is set again in quotes', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.name Ada Lovelace',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email "ada@example.com"',
      'git config --list',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
    expect(result.detour).toBeNull()
  })

  it('accepts a one-word name typed on purpose', async () => {
    const result = await replaySandbox('start-the-project', ['cd projects/todo-app', 'git init', 'git config --global user.name Ada'])

    expect(result.completed[2]).toBe(true)
    expect(result.detour).toBeNull()
  })

  it('accepts listing only the global settings', async () => {
    const result = await replaySandbox('start-the-project', [
      'cd projects/todo-app',
      'git init',
      'git config --global user.name "Ada Lovelace"',
      'git config --global user.email "ada@example.com"',
      'git config --global --list',
    ])

    expect(result.completed.every(Boolean)).toBe(true)
  })
})

describe('lesson 3: first commit', () => {
  it('counts the staging goal when the commit comes straight after git add', async () => {
    const result = await replaySandbox('first-commit', [
      'git status',
      'git add .',
      'git commit -m "feat: add task list"',
      'git status',
    ])

    expect(result.completed).toEqual([true, true, true, true])
  })

  it('accepts staging the files by name', async () => {
    const result = await replaySandbox('first-commit', [
      'git status',
      'git add .gitignore app.py debug.log',
      'git status',
      'git commit -m "feat: add task list"',
      'git status',
    ])

    expect(result.completed).toEqual([true, true, true, true])
  })

  it('does not count a commit run before anything is staged', async () => {
    const result = await replaySandbox('first-commit', ['git status', 'git commit -m "feat: add task list"'])

    expect(result.completed).toEqual([true, false, false, false])
  })

  it('does not count a message typed without quotes', async () => {
    const result = await replaySandbox('first-commit', ['git status', 'git add .', 'git status', 'git commit -m feat: add task list'])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBeNull()
  })

  it('explains a commit message without a type', async () => {
    const result = await replaySandbox('first-commit', [
      'git status',
      'git add .',
      'git status',
      'git commit -m "add task list"',
      'git status',
    ])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBe('message-without-type')
  })

  it('explains why Git refuses to stage the ignored tasks.txt', async () => {
    const result = await replaySandbox('first-commit', ['git status', 'git add tasks.txt'])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('ignored-file-added')
  })

  it.each(['git add -f tasks.txt', 'git add --force .'])('explains forcing the ignored file in with %s', async (line) => {
    const result = await replaySandbox('first-commit', ['git status', line])

    expect(result.detour).toBe('ignored-file-forced')
  })

  it('does not count a commit that forced the ignored file in', async () => {
    const result = await replaySandbox('first-commit', [
      'git status',
      'git add --force .',
      'git status',
      'git commit -m "feat: add task list"',
      'git status',
    ])

    expect(result.completed.slice(2)).toEqual([false, false])
    expect(result.detour).toBe('ignored-file-forced')
  })

  it('waits for every file before the commit counts', async () => {
    const partial = await replaySandbox('first-commit', [
      'git status',
      'git add app.py',
      'git commit -m "feat: add the app"',
      'git status',
    ])
    const finished = await replaySandbox('first-commit', [
      'git status',
      'git add app.py',
      'git commit -m "feat: add the app"',
      'git add .',
      'git commit -m "feat: add task list"',
      'git status',
    ])

    expect(partial.completed).toEqual([true, false, false, false])
    expect(finished.completed).toEqual([true, true, true, true])
  })
})
