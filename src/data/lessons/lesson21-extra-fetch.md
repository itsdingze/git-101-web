---
id: 21
title: "Extra: Fetch Before You Pull"
description: See what's new on the remote before it touches your files
unlocks: [ fetch ]
---

## Look before you pull {#fetch-vs-pull}

A teammate pushed something, and you'd like to see what it is before it lands in your files.

`git pull` does two jobs at once. It downloads new commits from the remote, then merges them into your branch, which changes your files. `git fetch` does only the first job, so you can look before anything changes:

```bash
git fetch origin               # download new commits, change no files
git log --oneline origin/main  # read what arrived
git pull                       # merge them when you're ready
```

`origin/main` is Git's note of where `main` on `origin` was the last time you fetched or pulled. Fetching moves that note forward. Your own `main` stays where it was until you pull.

## Fetch, then check {#fetch-and-status}

Let's see a fetch, then what `git status` says after it:

```bash
~/todo-app (main) $ git fetch origin
From https://github.com/study-group/todo-app
   08a5946..b8cd2e5  main       -> origin/main   # origin/main moved from 08a5946 to b8cd2e5
~/todo-app (main) $ git status
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean
```

"Behind" is the opposite of the "ahead" you saw before a push: the remote has a commit you don't. "Can be fast-forwarded" means you have nothing new of your own, so a pull only has to move your branch up.

> [!WARNING] "Up to date" may be stale
> Before a fetch, `git status` compares you with Git's old note of the remote. It can say `Your branch is up to date` while a teammate's commit waits on the remote.

## Read what arrived {#read-what-arrived}

The new commit is on your computer now, though not in your files. `git log` can read it before you pull, when it's given the name `origin/main`:

```bash
~/todo-app (main) $ git log --oneline origin/main
b8cd2e5 (origin/main) feat: add subtasks     # your teammate's commit
08a5946 (HEAD -> main) feat: add task list   # where you are now
~/todo-app (main) $ ls
app.txt                                      # your files haven't changed
```

Happy with what you see? `git pull` merges it in, and `subtasks.txt` appears in your folder.

```block-exercise
id: build-fetch
prompt: "Build the command that downloads new commits from `origin` without changing your files:"
availableBlocks: [ git, fetch, origin, pull, push, main ]
correctAnswer: [ git, fetch, origin ]
decoyReasons:
  pull: "`pull` downloads and then merges, which changes your files."
  push: "`push` sends your commits up, and you want to bring theirs down."
  main: Fetch downloads every branch from `origin`, so no branch name is needed.
hints:
  - The download-only command is `git fetch`.
  - Then name the remote.
  - The full command is `git fetch origin`.
```

```sandbox-exercise
id: fetch-then-pull
title: "Practice: look before you pull"
mode: guided
brief: Your `todo-app` is a clone of your team's repository. A teammate says they pushed something an hour ago. Find out what it is before you let it into your files. The remote here is simulated.
seed:
  dir: todo-app
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    setup:
      - write:
          app.txt: |
            tasks = load()
            show(tasks)
      - run: git add .
      - run: 'git commit -m "feat: add task list"'
    ahead:
      - write:
          subtasks.txt: |
            subtasks = split(task)
      - run: git add .
      - run: 'git commit -m "feat: add subtasks"'
  setup:
    - run: git config pull.rebase false
goals:
  - id: fetched
    label: Git's note of the remote is up to date
    narration: Run `git status` and see it claim you're up to date. Then download the new commit without merging it, and run `git status` again.
    check:
      kind: any-of
      checks:
        - kind: not
          check:
            kind: up-to-date-with-remote
            branch: main
        - kind: commit-exists
          messageIncludes: add subtasks
          onBranch: main
    hints:
      - The download-only command is `git fetch`, followed by the remote's name.
      - Run `git fetch origin`, then `git status`.
  - id: pulled
    label: Your `main` has your teammate's commit
    narration: Read the new commit with `git log --oneline origin/main`. It looks fine, so merge it in, then run `ls`.
    check:
      kind: commit-exists
      messageIncludes: add subtasks
      onBranch: main
    hints:
      - The command that merges the fetched commits into your branch is `git pull`.
      - Run `git pull`, then `ls` to see `subtasks.txt` arrive.
completionMessage: You read your teammate's commit before it touched your files, then pulled it in. Fetch first whenever you want to know what a pull will bring.
```

```quiz
id: quiz-stale-status
question: A teammate says they pushed an hour ago, but `git status` says `Your branch is up to date`. What do you run?
options:
  - text: "`git fetch origin`, then `git status`"
  - text: Nothing, since `git status` is always current
    whyWrong: Status compares you with Git's last note of the remote, which may be old.
  - text: "`git push`, to sync both copies"
    whyWrong: Push only sends your commits up, and brings nothing down.
correctIndex: 0
explanation: Fetching updates Git's note of the remote, so `git status` can show the gap.
```

## Recap {#recap}

You can now:

- Download new commits without touching your files
- Read what arrived before you merge it
- Spot when "up to date" is out of date

```bash
git fetch origin               # download, change no files
git log --oneline origin/main  # read what arrived
```

That's everything. Go build something, and commit early, push often.
