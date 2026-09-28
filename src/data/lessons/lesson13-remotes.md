---
id: 13
title: Remotes
description: Keep a copy of a project online, and copy one down
unlocks: [ remote, clone ]
---

## A copy somewhere else {#why-remotes}

Right now `todo-app` lives on one computer. If that computer breaks or gets lost, the project and its whole history go with it. Nobody else can reach your folder either, and two friends from your study group, Sam and Priya, want to help build the app.

A **remote** is a copy of your repository kept somewhere else, usually on GitHub. It backs up your work, and it gives a team one shared place to send commits to and get them from.

So your project now has a copy on GitHub, in the study group's account. Getting it there takes two commands you'll learn in Connect a Project. For this lesson, that step has been done for you.

> [!INFO] Copies don't sync by themselves
> Commits move between your copy and the remote only when you run a command. Nothing goes up or comes down on its own.

## A remote's address {#remote-url}

A remote lives at a **URL**, the same kind of address you type into a web browser. This is where the study group keeps `todo-app`:

```text
https://github.com/study-group/todo-app.git
```

Read it from left to right, like a path:

- `https://` says how to reach it: over the web, scrambled so nobody else can read it on the way.
- `github.com` is the website that stores the copy.
- `study-group/todo-app.git` is the account that owns the copy, then the repository inside it. Ending a repository's name in `.git` is a naming habit.

## Copy a project down {#git-clone}

Sam and Priya don't have the project yet. They each get it by **cloning** it. `git clone` copies the whole project, history included, into a new folder named after the repository.

You'll do the same on your laptop, which doesn't have the project either:

```bash
~ $ git clone https://github.com/study-group/todo-app.git
Cloning into 'todo-app'...                          # the name of the new folder
remote: Enumerating objects: 43, done.              # progress lines, safe to skim
remote: Counting objects: 100% (43/43), done.
remote: Compressing objects: 100% (7/7), done.
remote: Total 43 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (43/43), done.
~ $ ls
todo-app                                            # it landed in the folder you were in
```

The prompt `~ $` shows you're in your home folder, so that's where the clone landed. A clone always lands in the folder you're in, the same as `git init` does.

> [!INFO] Clone replaces init
> A cloned project is already a repository, so you never run `git init` in it.

## Look inside a clone {#inside-a-clone}

The new folder holds every file you committed, and every commit you made:

```bash
~ $ cd todo-app
~/todo-app (main) $ ls
app.txt  dates.txt  README.md  search-help.txt  search.txt  settings.txt
~/todo-app (main) $ git log --oneline -3            # the whole history came too
06f97e4 (HEAD -> main, origin/main) feat: add search   # origin/main is explained next
37e1612 fix: hide due dates on finished tasks
95ea34d Merge raise-limit
```

Your `notes` folder and `tasks.txt` aren't here. Git never committed them, so GitHub never got them. That's your `.gitignore` doing its job.

It works like any repository you've made yourself. You can commit, branch, and merge in it without the internet.

## The nickname origin {#origin}

Typing that long URL every time would be tiring, so the clone saved it under a short nickname, `origin`. Let's ask which remotes this project knows:

```bash
~/todo-app (main) $ git remote -v    # list remotes, and -v (verbose) shows their URLs
origin	https://github.com/study-group/todo-app.git (fetch)    # where commits come down from
origin	https://github.com/study-group/todo-app.git (push)     # where commits go up to
```

The `origin/main` in the log uses the same nickname. Read it like a path: the `main` branch on `origin`. It marks the commit the remote's `main` was on when your copy last heard from it.

```quiz
id: quiz-clone-contents
question: Sam clones `todo-app` from GitHub. What's in the new folder?
options:
  - text: Every committed file, plus the whole history
  - text: The newest files only, with no history
    whyWrong: A clone copies every commit, so `git log` shows the full history.
  - text: Everything in your folder, your `tasks.txt` included
    whyWrong: A clone only holds what was committed, and your rules kept `tasks.txt` out.
  - text: A shortcut that opens the project on GitHub's website
    whyWrong: The files are really on the computer, and work without the internet.
correctIndex: 0
explanation: A clone is a full copy of the repository, with `origin` already pointing back at GitHub.
```

```block-exercise
id: build-clone
prompt: "Build the command that copies the study group's project down from GitHub:"
availableBlocks: [ git, clone, "https://github.com/study-group/todo-app.git", init, remote, -v ]
correctAnswer: [ git, clone, "https://github.com/study-group/todo-app.git" ]
decoyReasons:
  init: "`git init` starts an empty repository, and a clone is already one."
  remote: "`git remote` lists the remotes of a project you already have."
  -v: "`-v` goes with `git remote`, to show each remote's URL."
hints:
  - Start with `git clone`.
  - Then say where the project lives.
  - The full command is `git clone https://github.com/study-group/todo-app.git`.
```

```sandbox-exercise
id: clone-the-team-project
title: "Practice: clone the project"
mode: guided
brief: You're on your laptop, in your home folder, `~`. The project isn't here yet, but the study group's copy is on GitHub at `https://github.com/study-group/todo-app.git`. Copy it down. The remote here is simulated.
seed:
  dir: ""
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    cloned: false
    setup:
      - story: after-undo-a-change
goals:
  - id: cloned
    label: A clone of `todo-app` sits in your home folder
    narration: Check the prompt shows `~ $`, then clone the project with `git clone` and its URL. Run `ls` to see the new folder.
    check:
      kind: clone-exists
      path: todo-app
    hints:
      - The command is `git clone`, followed by the URL in the brief.
      - Run `git clone https://github.com/study-group/todo-app.git`.
detours:
  - id: clone-nested
    check:
      kind: file-present
      path: todo-app/todo-app/README.md
    message: That clone landed inside another `todo-app` folder, because a clone makes its own folder wherever you are. Run `cd ~`, delete the outer one with `rm -r todo-app`, and clone again.
completionMessage: You copied the whole project down with one command. Step inside with `cd todo-app`, then run `git log --oneline -3` and `git remote -v` to see what came with it.
```

## Recap {#recap}

You can now:

- Say what a remote is for
- Read a remote's URL and its nickname
- Copy a project down with `git clone`
- Find the history and `origin` inside a clone

```bash
git clone <url>   # copy a project down
git remote -v     # list remotes and their URLs
```

Next up: sending your commits up, and bringing your friends' commits down.
