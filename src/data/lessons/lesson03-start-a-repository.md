---
id: 3
title: Start a Repository
description: Turn a folder into a repository and see what Git sees
unlocks: [ init, status ]
---

## Start a repository {#git-init}

Right now `todo-app` is an ordinary folder, and Git isn't watching it. Git only looks after a folder once you ask it to, by turning it into a **repository**: the place where Git keeps every commit of your project.

```bash
~/todo-app $ git init          # initialise: start a repository here
Initialized empty Git repository in /home/user/todo-app/.git/
~/todo-app (main) $            # the prompt now shows (main)
```

Git made a folder called `.git` inside `todo-app`, and that folder is the repository. Its name starts with a dot, which makes it **hidden**: plain `ls` skips it, and `ls -a` (all) shows it.

> [!INFO] A new repository is empty
> `git init` doesn't record any of your files. The repository holds nothing until you make your first commit.

## The name in the prompt {#branch-name}

What's the `(main)` that appeared in the prompt? It's the name of your **branch**, your current line of work. Every repository starts with one, and you'll learn what branches are for in a future lesson.

On your own computer, Git may call the first branch `master` instead. It's the same thing under an older name. Near the end of the course you'll change a setting so yours says `main` too.

## Ask Git what it sees {#git-status}

Git notices things you can't see by looking at your files, like which ones it has never recorded. `git status` asks it:

```bash
~/todo-app (main) $ git status     # what does Git see?
On branch main                     # the branch you're on

No commits yet                     # nothing recorded so far

Untracked files:                   # files Git has never recorded
  (use "git add <file>..." to include in what will be committed)
	README.md
	app.txt
	notes/                             # a folder, shown as one line

nothing added to commit but untracked files present (use "git add" to track)
```

Read it from the top:

- `On branch main` names your branch. Most Mac and Linux terminals don't show the branch in the prompt, so this line is where you check.
- `No commits yet` confirms the repository is still empty.
- `Untracked files` lists the files Git isn't recording yet. The next screen explains what that means.

The lines in brackets are Git's hints about what to run next. You'll learn `git add`, the command they mention, in the next lesson. A word in angle brackets, like `<file>`, is a **placeholder**: type a real file name in its place, without the brackets.

> [!TIP] Unsure? Run git status
> Run `git status` whenever you're unsure what's going on. You'll use it more than any other command.

## Tracked and untracked {#tracked-untracked}

Git doesn't record every file in your folder. It sorts each one into two kinds:

- A **tracked** file is one you've told Git to record. Git watches it, and tells you whenever it changes.
- An **untracked** file is one Git can see in your folder but isn't recording. Git only lists it, and never puts it in a commit.

Why doesn't Git track everything by itself? Some files should never go into your history, like a file of passwords. So Git waits for you to choose.

Everything in `todo-app` is untracked right now, which is why `git status` lists it all under `Untracked files`. A file becomes tracked the first time you add it with `git add`.

## A new file starts untracked {#new-file-untracked}

A file you make after `git init` starts out untracked too. Let's make one. A to-do list that never ends is no help, so the app will hold 10 tasks at most, and that limit goes in a file of its own:

```bash
~/todo-app (main) $ echo "MAX_TASKS = 10" > settings.txt
~/todo-app (main) $ git status
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
	app.txt
	notes/
	settings.txt                       # the new file, untracked like the rest

nothing added to commit but untracked files present (use "git add" to track)
```

> [!INFO] Untracked by default
> Every file starts out untracked, whether it was in the folder before `git init` or you made it afterwards. It stays untracked until you add it.

```quiz
id: quiz-init-records-nothing
question: "`todo-app` holds your files. You run `git init`, and no other command. Which files is Git tracking?"
options:
  - text: None, until you add them
  - text: All of them, since they were there before `git init`
    whyWrong: "`git init` only makes the repository. Every file starts untracked, however long it's been in the folder."
  - text: All of them, as soon as you save them
    whyWrong: Saving a file doesn't make Git track it. Only `git add` does.
  - text: Only files you create after `git init`
    whyWrong: When a file was made doesn't matter. New files start untracked too.
correctIndex: 0
explanation: Every file starts untracked. Git tracks a file only once you add it with `git add`.
```

```sandbox-exercise
id: first-repository-walkthrough
title: "Practice: turn a folder into a repository"
mode: guided
brief: You're in `todo-app`, which holds `README.md`, your `notes` folder, and the `app.txt` you wrote. Git isn't watching it yet. Turn it into a repository, then see what Git notices.
seed:
  dir: todo-app
  setup:
    - story: after-terminal-basics
goals:
  - id: repo
    label: "`todo-app` is a Git repository"
    narration: Turn `todo-app` into a repository. Git replies with the path of the new `.git` folder.
    check:
      kind: repo-initialized
    hints:
      - Git only looks after a folder once you tell it to.
      - Run `git init`.
  - id: settings-file
    label: "A new file, `settings.txt`, sits in the folder"
    narration: >-
      Run `git status` and see everything untracked. Then give the app its task limit with `echo "MAX_TASKS = 10" > settings.txt`, and run `git status` again.
    check:
      kind: file-present
      path: settings.txt
    hints:
      - Run `git status` first, so you can see what changes afterwards.
      - Run `echo "MAX_TASKS = 10" > settings.txt`, then `git status` again.
detours:
  - id: repo-above-project
    check:
      kind: repo-above-project
    message: Git made the repository in the folder above `todo-app`, because that's where you were standing. Press **Start over**, check that the prompt shows `~/todo-app $`, then run `git init`.
  - id: repo-nested-inside-project
    check:
      kind: all-of
      checks:
        - kind: not
          check:
            kind: repo-initialized
        - kind: not
          check:
            kind: repo-above-project
        - kind: file-present
          path: todo-app
    message: A name after `git init` makes a new folder by that name. Delete it with `rm -r todo-app`, which removes a folder and everything inside it, then run plain `git init`.
completionMessage: Git lists everything in the folder as untracked, your new file included, and it won't track any of it until you add it. Every new repository starts like this.
```

## Recap {#recap}

You can now:

- Turn a folder into a repository
- Find the hidden `.git` folder
- Read what `git status` tells you
- Spot the files Git isn't tracking yet

```bash
git init      # turn this folder into a repository
ls -a         # show hidden files too
git status    # show what Git sees
```

Next up: you stage your files and make your first commit.
