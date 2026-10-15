import { describe, expect, it } from 'vitest'
import { createSandbox, type SandboxSeed } from '@/lib/git-sim/createSandbox'
import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'

const SEED: SandboxSeed = {
  dir: 'todo-app',
  setup: [
    { run: 'git init' },
    {
      write: {
        'README.md': '# Todo\n',
        'tasks.txt': 'buy milk\n',
        'tasks-done.txt': 'walk dog\n',
        'notes/todo.txt': 'ideas\n',
        'new.txt': 'new\n',
        '.gitignore': '*.log\n',
      },
    },
    { run: 'git add .' },
    { run: 'git commit -m "Start the list"' },
    { run: 'git branch feature-login' },
    { run: 'git branch feature-signup' },
  ],
}

async function complete(line: string, locks?: CommandLocks, cursor = line.length) {
  const sandbox = await createSandbox(SEED, locks)
  return sandbox.complete(line, cursor)
}

describe('tab completion of paths', () => {
  it('completes a unique file and adds a space after it', async () => {
    expect(await complete('git add READ')).toEqual({ line: 'git add README.md ', cursor: 18, matches: ['README.md'] })
  })

  it('completes a unique folder with a trailing slash and no space', async () => {
    expect(await complete('cat no')).toEqual({ line: 'cat notes/', cursor: 10, matches: ['notes/'] })
  })

  it('completes the common prefix of several matches and lists them', async () => {
    expect(await complete('git rm tas')).toEqual({
      line: 'git rm tasks',
      cursor: 12,
      matches: ['tasks-done.txt', 'tasks.txt'],
    })
  })

  it('offers only folders after cd', async () => {
    expect(await complete('cd n')).toEqual({ line: 'cd notes/', cursor: 9, matches: ['notes/'] })
  })

  it('completes inside a folder named before the last slash', async () => {
    expect(await complete('git diff notes/t')).toEqual({
      line: 'git diff notes/todo.txt ',
      cursor: 24,
      matches: ['todo.txt'],
    })
  })

  it('completes the path for git restore, git show and file commands', async () => {
    expect((await complete('git restore --staged new')).line).toBe('git restore --staged new.txt ')
    expect((await complete('git show REA')).line).toBe('git show README.md ')
    expect((await complete('ls not')).line).toBe('ls notes/')
  })

  it('leaves hidden entries out unless the word starts with a dot', async () => {
    expect((await complete('cat ')).matches).toEqual(['new.txt', 'notes/', 'README.md', 'tasks-done.txt', 'tasks.txt'])
    expect(await complete('cat .giti')).toEqual({ line: 'cat .gitignore ', cursor: 15, matches: ['.gitignore'] })
  })

  it('completes the word at the cursor and keeps the text after it', async () => {
    expect(await complete('cat REA notes', undefined, 7)).toEqual({
      line: 'cat README.md  notes',
      cursor: 14,
      matches: ['README.md'],
    })
  })

  it('changes nothing when no entry matches', async () => {
    expect(await complete('cat zzz')).toEqual({ line: 'cat zzz', cursor: 7, matches: [] })
  })
})

describe('tab completion of branch names', () => {
  it('completes branches after git switch, git merge and git branch -d', async () => {
    expect(await complete('git switch fea')).toEqual({
      line: 'git switch feature-',
      cursor: 19,
      matches: ['feature-login', 'feature-signup'],
    })
    expect((await complete('git merge ma')).line).toBe('git merge main ')
    expect((await complete('git branch -d feature-l')).line).toBe('git branch -d feature-login ')
  })

  it('does not offer file names where a branch is expected', async () => {
    expect((await complete('git switch REA')).matches).toEqual([])
  })
})

describe('tab completion of git commands', () => {
  it('completes git subcommands', async () => {
    expect(await complete('git sta')).toEqual({ line: 'git sta', cursor: 7, matches: ['stash', 'status'] })
    expect((await complete('git comm')).line).toBe('git commit ')
  })

  it('offers only unlocked subcommands', async () => {
    const stashLocked: CommandLocks = new Map([['stash', 'a later lesson']])

    expect(await complete('git sta', stashLocked)).toEqual({ line: 'git status ', cursor: 11, matches: ['status'] })
  })

  it('does not complete the first word', async () => {
    expect(await complete('gi')).toEqual({ line: 'gi', cursor: 2, matches: [] })
  })
})
