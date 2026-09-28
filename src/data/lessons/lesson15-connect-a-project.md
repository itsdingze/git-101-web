---
id: 15
title: Connect a Project
description: Put a project you started yourself online for the first time
unlocks: []
---

## Connect and push {#connect-project}

Two lessons ago, your project was already on GitHub when you cloned it. That step was done for you. Now you'll do it yourself, back on the computer where the project started.

A clone knows its remote from the start. Your original `todo-app` began with `git init`, so it has no remote yet, and `git push` has nowhere to send it.

First you make an empty repository on GitHub, which gives you its URL. Then you connect the two:

```bash
~/todo-app (main) $ git remote -v                                               # no remotes yet, so no output
~/todo-app (main) $ git remote add origin https://github.com/study-group/todo-app.git   # nickname this URL origin
~/todo-app (main) $ git push -u origin main                                     # send main up, and pair it
Enumerating objects: 5, done.                                                   # progress lines, safe to skim
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), done.
To https://github.com/study-group/todo-app.git
 * [new branch]      main -> main                                               # the remote now has a main
branch 'main' set up to track 'origin/main'.                                    # the pairing, from -u
```

`git remote add` takes a nickname and a URL. You can pick any name, but `origin` is the one almost everyone uses, and the one `git clone` sets up.

Every commit you made in the first twelve lessons is on GitHub now. That's the copy your laptop cloned.

## Pair your branch {#tracking}

The `-u` in that push pairs your `main` with the `main` on the remote, which Git calls **tracking**. It's a different kind of tracking from tracked files: here a branch knows its partner on the remote.

`-u` is short for `--set-upstream`, and **upstream** is Git's word for that partner. It has nothing to do with the `-u` in `git stash -u`, because every command has its own flags.

Once the pair exists, `git status` compares your branch with `origin/main`, the same as it does in a clone:

```bash
~/todo-app (main) $ git status
On branch main
Your branch is up to date with 'origin/main'.    # nothing to send, nothing to get

nothing to commit, working tree clean
```

> [!TIP] After that, plain push works
> You only need `-u` on a branch's first push. From then on, plain `git push` and `git pull` know where to go.

```block-exercise
id: build-push-u
prompt: "This is the first push of `main` to `origin`. Build the command that sends it and pairs it:"
availableBlocks: [ git, push, -u, origin, main, pull, remote ]
correctAnswer: [ git, push, -u, origin, main ]
acceptableAnswers:
  - [ git, push, origin, main, -u ]
decoyReasons:
  pull: "`pull` brings commits down, and you want to send yours up."
  remote: "`git remote` manages nicknames without sending anything."
hints:
  - Sending is `git push`, and the pairing flag comes straight after it.
  - Then the remote's name, then the branch's name.
  - The full command is `git push -u origin main`.
```

```sandbox-exercise
id: connect-new-project
title: "Practice: connect a project and push it"
mode: guided
brief: This is your original `todo-app`, as it was before it went online. It started with `git init`, so it has no remote. An empty repository is waiting for it on GitHub, at `https://github.com/study-group/todo-app.git`. The remote here is simulated.
seed:
  dir: todo-app
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    cloned: false
  setup:
    - story: after-undo-a-change
goals:
  - id: pushed-main
    label: Your `main` and its commits are on GitHub
    narration: Run `git remote -v` and see that it prints nothing. Add the URL as `origin`, then push `main` with `-u`.
    check:
      kind: pushed
      branch: main
    hints:
      - One command gives the URL a nickname, and another sends `main` to it.
      - Run `git remote add origin https://github.com/study-group/todo-app.git`.
      - Then run `git push -u origin main`.
  - id: paired
    label: "`main` is paired with `origin/main`"
    narration: Run `git status` and look for the line that names `origin/main`.
    check:
      kind: upstream-set
      branch: main
    hints:
      - The pairing comes from `-u` on a push.
      - Run `git push -u origin main`, which sets up the pairing.
detours:
  - id: pushed-without-u
    check:
      kind: all-of
      checks:
        - kind: pushed
          branch: main
        - kind: not
          check:
            kind: upstream-set
            branch: main
    message: Your commits reached GitHub, but `main` isn't paired, because the push had no `-u`. Run `git push -u origin main` once to pair it.
completionMessage: The project is online and paired, so plain `git push` works from now on. Soon you'll do this with a project of your own.
```

```quiz
id: quiz-origin
question: A guide tells you to run `git push origin main`. What does `origin` stand for?
options:
  - text: The nickname for the remote's URL
  - text: The branch the commits go to
    whyWrong: That's `main`, the word after it.
  - text: The first commit in the project
    whyWrong: "`origin` names a place to send commits, not a commit."
  - text: The folder you're working in right now
    whyWrong: Your own copy needs no name, and `origin` names the other one.
correctIndex: 0
explanation: The nickname stands in for the long URL, so you never have to type it again.
```

## Recap {#recap}

You can now:

- Connect a project to a remote with `git remote add`
- Push a branch for the first time with `-u`
- Use plain push and pull once a branch is paired

```bash
git remote add origin <url>   # nickname a URL "origin"
git push -u origin main       # first push, and pair
```

Next up: working on a shared project with a team.
