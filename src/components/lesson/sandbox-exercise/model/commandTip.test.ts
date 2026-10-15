import { describe, expect, it } from 'vitest'
import { commandTip } from './commandTip'

const pathspecError = [{ stream: 'stderr' as const, text: "error: pathspec 'commit' did not match any file(s) known to git" }]
const quiet: { stream: 'stdout' | 'stderr'; text: string }[] = []
const failure = [{ stream: 'stderr' as const, text: 'fatal: bad thing' }]

describe('commandTip for commit messages', () => {
  it('asks for quotes around a multi-word commit message', () => {
    expect(commandTip('git commit -m first commit', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -m "first commit"`',
    )
    expect(commandTip('git commit -am Fix the year', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -am "Fix the year"`',
    )
  })

  it('handles --message and git stash push -m', () => {
    expect(commandTip('git commit --message first commit', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit --message "first commit"`',
    )
    expect(commandTip('git stash push -m two words', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git stash push -m "two words"`',
    )
  })

  it('treats words after the message that start with a dash as flags', () => {
    expect(commandTip('git commit -m Fix --amend', quiet)).toBeNull()
    expect(commandTip('git commit -m Fix -a', quiet)).toBeNull()
    expect(commandTip('git commit -m Fix the year --amend', pathspecError)).toBe(
      'Put the message in quotes, so Git reads it as one message: `git commit -m "Fix the year" --amend`',
    )
  })

  it('stays quiet when the message is quoted, even if it mentions -m', () => {
    expect(commandTip('git commit -m "first commit"', quiet)).toBeNull()
    expect(commandTip("git commit -m 'first commit'", quiet)).toBeNull()
    expect(commandTip('git commit -m "Explain -m and quotes"', quiet)).toBeNull()
    expect(commandTip('git commit -m first', quiet)).toBeNull()
  })

  it('asks for straight quotes when curly quotes were used', () => {
    expect(commandTip('git commit -m “first commit”', pathspecError)).toBe(
      'Those are curly quotes, which the terminal doesn\'t treat as quotes. Type straight quotes instead: `git commit -m "first commit"`',
    )
  })
})

describe('commandTip for names', () => {
  it('warns that an unquoted full name saves only the first word', () => {
    expect(commandTip('git config --global user.name Ada Lovelace', quiet)).toBe(
      'Only the first word, `Ada`, was saved as your name. Put your full name in quotes: `git config --global user.name "Ada Lovelace"`',
    )
    expect(commandTip('git config user.name Ada Lovelace', quiet)).toBe(
      'Only the first word, `Ada`, was saved as your name. Put your full name in quotes: `git config user.name "Ada Lovelace"`',
    )
  })

  it('explains a name Git refused to save', () => {
    expect(commandTip('git config --global user.name Ada King Lovelace', failure)).toBe(
      'Git couldn\'t read that as one name, so nothing was saved. Put your full name in quotes: `git config --global user.name "Ada King Lovelace"`',
    )
  })

  it('stays quiet for a quoted name or reading the name back', () => {
    expect(commandTip('git config --global user.name "Ada Lovelace"', quiet)).toBeNull()
    expect(commandTip('git config user.name', quiet)).toBeNull()
    expect(commandTip('git config --global user.name Ada', quiet)).toBeNull()
  })
})

describe('commandTip for copied text', () => {
  it('points out a copied prompt sign', () => {
    expect(commandTip('$ git status', [{ stream: 'stderr', text: 'command not found: $' }])).toBe(
      "Leave out the `$` at the start. It's the prompt, not part of the command.",
    )
  })

  it('points out a whole copied prompt with its folder and branch', () => {
    const notFound = [{ stream: 'stderr' as const, text: 'bash: ~/todo-app: command not found' }]
    expect(commandTip('~/todo-app (main) $ git status', notFound)).toBe(
      'Leave out the prompt, everything up to and including the `$`. Type only the command: `git status`',
    )
  })

  it('points out a copied note when the command failed', () => {
    expect(commandTip('git init    # turn the folder into a repository', failure)).toBe(
      'Leave out the note after `#`. Copy only the command itself: `git init`',
    )
    expect(commandTip('git status #note', failure)).toBe(
      'Leave out the note after `#`. Copy only the command itself: `git status`',
    )
    expect(commandTip('git init    # note', [{ stream: 'stdout', text: 'Initialized' }])).toBeNull()
  })

  it('does not mistake a # inside quotes for a note', () => {
    expect(commandTip('echo "# My project" > README.md', failure)).toBeNull()
  })
})

describe('commandTip for merge direction', () => {
  it('explains which way git merge main goes when standing on another branch', () => {
    expect(commandTip('git merge main', [{ stream: 'stdout', text: 'Already up to date.' }], { branch: 'add-navbar' })).toBe(
      "You're on `add-navbar`, so this brings `main` into `add-navbar`. If you meant to bring `add-navbar` into `main`, run `git switch main` first, then `git merge add-navbar`.",
    )
  })

  it('says to start over when the wrong-way merge stopped on a conflict', () => {
    const conflict = [{ stream: 'stdout' as const, text: 'CONFLICT (content): Merge conflict in settings.txt' }]
    expect(commandTip('git merge main', conflict, { branch: 'raise-limit' })).toBe(
      "You're on `raise-limit`, so this brings `main` into `raise-limit`. If you meant to bring `raise-limit` into `main`, press Start over, then run `git switch main` and `git merge raise-limit`.",
    )
  })

  it('stays quiet on main or for other merges', () => {
    expect(commandTip('git merge main', quiet, { branch: 'main' })).toBeNull()
    expect(commandTip('git merge add-navbar', quiet, { branch: 'main' })).toBeNull()
    expect(commandTip('git merge main', quiet, { branch: null })).toBeNull()
  })
})

describe("commandTip for merging main while GitHub's main has new work", () => {
  const upToDate = [{ stream: 'stdout' as const, text: 'Already up to date.' }]
  const onGitHub =
    "The new work is on GitHub's `main`, not on your `main` yet. Run `git pull origin main` to bring it into this branch."

  it('points to git pull origin main', () => {
    expect(commandTip('git merge main', upToDate, { branch: 'add-reminders', newOnGitHubMain: true })).toBe(onGitHub)
  })

  it('keeps the direction tip when GitHub has nothing new', () => {
    expect(commandTip('git merge main', upToDate, { branch: 'add-reminders', newOnGitHubMain: false })).toMatch(
      /^You're on `add-reminders`, so this brings `main` into `add-reminders`\./,
    )
  })

  it('keeps the direction tip when the merge brought something in', () => {
    const merged = [{ stream: 'stdout' as const, text: 'Updating 1a2b3c4..5d6e7f8\nFast-forward' }]

    expect(commandTip('git merge main', merged, { branch: 'add-reminders', newOnGitHubMain: true })).toMatch(
      /^You're on `add-reminders`/,
    )
  })
})

describe('commandTip for a project with no remote yet', () => {
  const noOrigin = [
    { stream: 'stderr' as const, text: "fatal: 'origin' does not appear to be a git repository\nfatal: Could not read from remote repository." },
  ]
  const noDestination = [{ stream: 'stderr' as const, text: 'fatal: No configured push destination.' }]
  const connectTip =
    "This project isn't connected to GitHub yet, so there's nowhere to send it. Connect it first with `git remote add origin <url>`, using the address of your GitHub repository, then try again."

  it('explains that the remote has to be added first', () => {
    expect(commandTip('git push', noDestination)).toBe(connectTip)
  })

  it('covers both a missing origin and a wrong address when origin cannot be reached', () => {
    expect(commandTip('git push -u origin main', noOrigin)).toBe(
      "Git can't reach `origin`. Run `git remote -v`: if nothing is listed, add it with `git remote add origin <url>`. If the address looks wrong, press Start over and add the right one.",
    )
  })

  it('stays quiet when the push worked', () => {
    expect(commandTip('git push -u origin main', quiet)).toBeNull()
  })
})

describe('commandTip for a commit with nothing staged', () => {
  const unstaged = [
    { stream: 'stdout' as const, text: 'On branch main\n\tmodified:   settings.txt\n\nno changes added to commit (use "git add" and/or "git commit -a")' },
  ]
  const untrackedOnly = [
    { stream: 'stdout' as const, text: 'nothing added to commit but untracked files present (use "git add" to track)' },
  ]
  const stageFirst =
    "Nothing is staged, so there's nothing to commit. Stage your changes with `git add <file>` first, then commit."

  it('says to stage first', () => {
    expect(commandTip('git commit -m "feat: raise the limit"', unstaged)).toBe(stageFirst)
    expect(commandTip('git commit -m "feat: add tags"', untrackedOnly)).toBe(stageFirst)
  })

  it('stays quiet for git status, which prints the same lines', () => {
    expect(commandTip('git status', unstaged)).toBeNull()
  })
})

describe('commandTip outside a repository', () => {
  const notARepository = [
    { stream: 'stderr' as const, text: 'fatal: not a git repository (or any of the parent directories): .git' },
  ]

  it('points to cd first, and git init only for a brand-new project', () => {
    expect(commandTip('git status', notARepository)).toBe(
      "This folder isn't a Git repository. Run `ls`: if your project is a folder here, `cd` into it first. Run `git init` only to start a brand-new repository.",
    )
  })

  it('points to git init here when this folder holds project files and no repository', () => {
    const project = { files: ['app.txt', 'notes/ideas.txt'], repositories: [] }

    expect(commandTip('git status', notARepository, { folder: project })).toBe(
      "This folder isn't a Git repository yet. If it's your project, run `git init` here to start one.",
    )
  })

  it('keeps pointing to cd when the project is a folder here', () => {
    const home = { files: ['todo-app/app.txt'], repositories: [] }
    const cloned = { files: ['stray.txt', 'todo-app/app.txt'], repositories: ['todo-app'] }

    expect(commandTip('git status', notARepository, { folder: home })).toMatch(/^This folder isn't a Git repository\. Run `ls`/)
    expect(commandTip('git status', notARepository, { folder: cloned })).toMatch(/^This folder isn't a Git repository\. Run `ls`/)
  })
})

describe('commandTip for git config outside a repository', () => {
  const notInGitDirectory = [{ stream: 'stderr' as const, text: 'fatal: not in a git directory' }]

  it('suggests --global with the same setting', () => {
    expect(commandTip('git config user.name "Ada Lovelace"', notInGitDirectory)).toBe(
      'Add `--global` so the setting covers every project: `git config --global user.name "Ada Lovelace"`',
    )
  })
})

describe('commandTip for a branch name already taken', () => {
  const exists = [{ stream: 'stderr' as const, text: "fatal: a branch named 'recovered' already exists" }]

  it('offers to switch to it or delete it', () => {
    expect(commandTip('git switch -c recovered e36bfac', exists)).toBe(
      'You already have a branch called `recovered`. Move onto it with `git switch recovered`, or delete it with `git branch -d recovered` and try again.',
    )
  })

  it('never suggests deleting main', () => {
    const mainExists = [{ stream: 'stderr' as const, text: "fatal: a branch named 'main' already exists" }]
    expect(commandTip('git switch -c main', mainExists)).toBe(
      '`main` already exists. Move onto it with `git switch main`.',
    )
  })
})

describe('commandTip for an empty git diff', () => {
  it('points to git status and the staged diff when plain diff prints nothing', () => {
    expect(commandTip('git diff', [])).toBe(
      'No output means no unstaged changes to tracked files. Use `git status` to check for new files and `git diff --staged` to inspect staged changes.',
    )
  })

  it('stays quiet when the diff printed something', () => {
    expect(commandTip('git diff', [{ stream: 'stdout', text: 'diff --git a/app.txt b/app.txt' }])).toBeNull()
  })
})

describe('commandTip for a commit blocked by a conflict', () => {
  const unresolved = [
    {
      stream: 'stderr' as const,
      text: 'error: Committing is not possible because you have unmerged files.\nfatal: Exiting because of an unresolved conflict.',
    },
  ]

  it('says to stage the settled file first', () => {
    expect(commandTip('git commit --no-edit', unresolved)).toBe(
      'A file still has a conflict. Fix it, stage it with `git add <file>` to mark it settled, then commit.',
    )
  })
})

describe('commandTip for a merge blocked by uncommitted changes', () => {
  const blocked = [
    {
      stream: 'stderr' as const,
      text: 'error: Your local changes to the following files would be overwritten by merge:\n\tsettings.txt\nPlease commit your changes or stash them before you merge.\nAborting',
    },
  ]

  it('says to commit or stash first, then run the command again', () => {
    expect(commandTip('git merge raise-limit', blocked)).toBe(
      "You have changes that aren't committed yet. Commit or stash them first, then run the command again.",
    )
  })
})

describe('commandTip for a commit that is not in this history', () => {
  const unknown = [
    {
      stream: 'stderr' as const,
      text: "fatal: ambiguous argument 'e36bfac': unknown revision or path not in the working tree.",
    },
  ]

  it('says to take a hash from your own git log', () => {
    expect(commandTip('git show e36bfac', unknown)).toBe(
      "`e36bfac` isn't in your history. Run `git log --oneline` and use a hash from your own list.",
    )
  })

  it('stays quiet when git show worked', () => {
    expect(commandTip('git show e36bfac', [{ stream: 'stdout', text: 'commit e36bfac' }])).toBeNull()
  })
})

describe('commandTip for merging the branch you are on', () => {
  const upToDate = [{ stream: 'stdout' as const, text: 'Already up to date.' }]

  it('explains that the receiving branch has to be someone else', () => {
    expect(commandTip('git merge add-due-dates', upToDate, { branch: 'add-due-dates' })).toBe(
      "You're already on `add-due-dates`, so there's nothing to bring in. Move to the branch that should receive the work first, like `git switch main`, then run `git merge add-due-dates`.",
    )
  })

  it('stays quiet when merging another branch', () => {
    expect(commandTip('git merge add-due-dates', upToDate, { branch: 'main' })).toBeNull()
  })
})

describe('commandTip for curly quotes that went through without an error', () => {
  it('still asks for straight quotes, because echo writes them into the file', () => {
    expect(commandTip('echo “MAX_TASKS = 25” > settings.txt', quiet)).toBe(
      'Those are curly quotes, which the terminal doesn\'t treat as quotes. Type straight quotes instead: `echo "MAX_TASKS = 25" > settings.txt`',
    )
  })
})

describe('commandTip for a mistyped remote', () => {
  it('shows how to fix an origin that already exists', () => {
    const exists = [{ stream: 'stderr' as const, text: 'error: remote origin already exists.' }]

    expect(commandTip('git remote add origin https://github.com/study-group/todo-app.git', exists)).toBe(
      '`origin` already has an address. Check it with `git remote -v`. If it looks wrong, press Start over and add the right one.',
    )
  })

  it('points at the address when a push finds no repository there', () => {
    const notFound = [
      { stream: 'stderr' as const, text: "remote: Repository not found.\nfatal: repository 'https://github.com/study-grup/todo-app.git/' not found" },
    ]

    expect(commandTip('git push -u origin main', notFound)).toBe(
      "Git couldn't find a repository at that address. Check it for typos with `git remote -v`. If it's wrong, press Start over and add the right one.",
    )
  })

  it('asks for a second look at the address when a clone finds nothing', () => {
    const notFound = [{ stream: 'stderr' as const, text: "Cloning into 'todo-app'...\nremote: Repository not found." }]

    expect(commandTip('git clone https://github.com/study-grup/todo-app.git', notFound)).toBe(
      "Git couldn't find a repository at that address. Check it for typos, then run `git clone` again.",
    )
  })
})

describe('commandTip for deleting an unmerged branch', () => {
  it('warns against the -D that Git suggests', () => {
    const unmerged = [{ stream: 'stderr' as const, text: "error: The branch 'recovered' is not fully merged." }]

    expect(commandTip('git branch -d recovered', unmerged)).toBe(
      "Git couldn't confirm that this branch is merged. Merge work you need before deleting it. `-D` skips that check and can make unmerged commits hard to recover.",
    )
  })
})

describe('commandTip for switching to a branch that does not exist', () => {
  const invalid = (name: string) => [{ stream: 'stderr' as const, text: `fatal: invalid reference: ${name}` }]

  it('suggests -c to create it', () => {
    expect(commandTip('git switch add-due-dates', invalid('add-due-dates'))).toBe(
      "There's no branch called `add-due-dates` yet. To create it and move onto it, add `-c`: `git switch -c add-due-dates`",
    )
  })

  it('treats a second word that looks like a hash as a missing commit, not a spaced name', () => {
    expect(commandTip('git switch -c recovered e36bfac', invalid('e36bfac'))).toBe(
      "There's no commit `e36bfac` in this repository. Run `git log --oneline` and copy a hash from its list.",
    )
  })

  it('points to hyphens when the new name has spaces', () => {
    expect(commandTip('git switch -c add due dates', invalid('due'))).toBe(
      "Branch names can't have spaces. Join the words with hyphens: `git switch -c add-due-dates`",
    )
  })
})

describe('commandTip for a commit message without a type', () => {
  const committed = [{ stream: 'stdout' as const, text: '[main 1a2b3c4] first commit\n 1 file changed' }]

  it('nudges toward the course style', () => {
    expect(commandTip('git commit -m "first commit"', committed)).toBe(
      'This course starts each message with its type, like `feat: add search` or `fix: stop crash`.',
    )
  })

  it('nudges on the very first commit too', () => {
    const rootCommit = [{ stream: 'stdout' as const, text: '[main (root-commit) 87b9c11] first commit\n 4 files changed' }]
    expect(commandTip('git commit -m "first commit"', rootCommit)).toBe(
      'This course starts each message with its type, like `feat: add search` or `fix: stop crash`.',
    )
  })

  it('stays quiet for a typed message', () => {
    expect(commandTip('git commit -m "feat: add search"', committed)).toBeNull()
    expect(commandTip('git commit --no-edit', committed)).toBeNull()
  })

  it('stays quiet for the merge and revert wording Git itself uses', () => {
    expect(commandTip(`git commit -m "Merge branch 'raise-limit'"`, committed)).toBeNull()
    expect(commandTip('git commit -m "Revert dark mode"', committed)).toBeNull()
  })
})

describe('commandTip for a force-push', () => {
  const pushed = [{ stream: 'stdout' as const, text: ' + 3cdcf25...fd4bbdb main -> main (forced update)' }]

  it('explains what it threw away', () => {
    const tip =
      "That replaced GitHub's copy with yours, so any commits your teammates pushed are gone from it. Pull instead of forcing. If a goal can no longer be met, press Start over."
    expect(commandTip('git push --force', pushed)).toBe(tip)
    expect(commandTip('git push -f origin main', pushed)).toBe(tip)
  })
})

describe('commandTip for a clone address without https://', () => {
  it('adds the missing start', () => {
    const missing = [{ stream: 'stderr' as const, text: "fatal: repository 'github.com/study-group/todo-app' does not exist" }]

    expect(commandTip('git clone github.com/study-group/todo-app', missing)).toBe(
      'A web address needs its start too: `git clone https://github.com/study-group/todo-app`',
    )
  })
})

describe('commandTip for a clone of an owner and repository name', () => {
  const notARepository = [
    {
      stream: 'stderr' as const,
      text: "Cloning into 'todo-app'...\nfatal: 'your-username/todo-app' does not appear to be a git repository",
    },
  ]
  const useGhOrAddress =
    'Git needs the full address. Run `gh repo clone your-username/todo-app`, or `git clone https://github.com/your-username/todo-app.git`.'

  it('points to gh repo clone or the full address', () => {
    expect(commandTip('git clone your-username/todo-app', notARepository)).toBe(useGhOrAddress)
  })

  it('leaves .git off the gh name', () => {
    expect(commandTip('git clone your-username/todo-app.git', notARepository)).toBe(useGhOrAddress)
  })
})

describe('commandTip for a command the terminal does not know', () => {
  const notFound = (name: string) => [{ stream: 'stderr' as const, text: `bash: ${name}: command not found` }]

  it('points out that commands are lowercase', () => {
    expect(commandTip('PWD', notFound('PWD'))).toBe('Commands are lowercase. Try `pwd`.')
  })

  it('adds the missing space in cd..', () => {
    expect(commandTip('cd..', notFound('cd..'))).toBe('Put a space between `cd` and `..`: `cd ..`')
  })

  it('points Windows habits to their bash version', () => {
    expect(commandTip('dir', notFound('dir'))).toBe('`dir` is a Windows command. In this terminal, `ls` lists a folder.')
  })

  it('never points at a terminal command the course leaves locked', () => {
    expect(commandTip('CAT', notFound('CAT'))).toBeNull()
    expect(commandTip('type', notFound('type'))).toBeNull()
    expect(commandTip('del', notFound('del'))).toBeNull()
  })
})

describe('commandTip for a name that does not match', () => {
  it('suggests checking the exact name', () => {
    const missing = [{ stream: 'stderr' as const, text: 'bash: cd: Notes: No such file or directory' }]

    expect(commandTip('cd Notes', missing)).toBe(
      "Nothing in this folder has that exact name. Run `ls` to see what's here, and type names exactly, capitals included.",
    )
  })

  it('says which folder below holds a file with that name', () => {
    const missing = [{ stream: 'stderr' as const, text: 'cat: ideas.txt: No such file or directory' }]
    const project = { files: ['app.txt', 'notes/ideas.txt'], repositories: [] }

    expect(commandTip('cat ideas.txt', missing, { folder: project })).toBe('`ideas.txt` is inside `notes`. Run `cd notes` first.')
  })

  it('says which folder below holds a folder with that name', () => {
    const missing = [{ stream: 'stderr' as const, text: 'bash: cd: notes: No such file or directory' }]
    const home = { files: ['todo-app/app.txt', 'todo-app/notes/ideas.txt'], repositories: [] }

    expect(commandTip('cd notes', missing, { folder: home })).toBe('`notes` is inside `todo-app`. Run `cd todo-app` first.')
  })
})

describe('commandTip for everything else', () => {
  it('says nothing about ordinary commands', () => {
    expect(commandTip('git status', quiet)).toBeNull()
  })
})
