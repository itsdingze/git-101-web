---
id: 14
title: Push and Pull
description: Send your commits up, and bring your team's commits down
unlocks: [ pull, push ]
---

## Two directions {#push-and-pull}

Your clone and the remote are separate copies, so they drift apart. You make a commit, and the remote doesn't have it. Sam sends a commit to the remote, and you don't have it.

Two commands close the gap, one for each direction:

```bash
git pull   # bring new commits down from the remote
git push   # send your new commits up to the remote
```

Both already know where to go, because your clone saved the remote as `origin`.

## Have you pushed yet? {#ahead-of-remote}

A remote only takes commits, so your work has to be committed first. Next on your list is tags, so you write the feature and commit it:

```bash
~/todo-app (main) $ echo "tags = ask()" > tags.txt
~/todo-app (main) $ git add tags.txt
~/todo-app (main) $ git commit -m "feat: add tags"
[main a95c752] feat: add tags
 1 file changed, 1 insertion(+)
 create mode 100644 tags.txt
```

A commit feels finished, so it's easy to forget the push. `git status` tells you, by comparing your branch with `origin/main`:

```bash
~/todo-app (main) $ git status
On branch main
Your branch is ahead of 'origin/main' by 1 commit.   # one commit the remote doesn't have
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

```quiz
id: quiz-commit-vs-push
question: You committed, and Git said `1 file changed`. Your GitHub page doesn't show the change. Why?
options:
  - text: The commit is only on your computer
  - text: The commit failed without saying so
    whyWrong: Seeing `1 file changed` means the commit worked, on your computer.
  - text: GitHub takes a few minutes to update
    whyWrong: GitHub can't see your computer, so waiting won't help.
  - text: You forgot to stage the file first
    whyWrong: Seeing `1 file changed` confirms the file is in the commit.
correctIndex: 0
explanation: A commit stays on your computer until `git push` sends it to GitHub.
```

## When a push is refused {#push-rejected}

`git push` sends every commit the remote doesn't have yet. But while you were writing tags, Sam pushed a feature too, reminders. Now the remote has a commit you don't, and Git refuses your push rather than lose that work:

```bash
~/todo-app (main) $ git push
To https://github.com/study-group/todo-app.git
 ! [rejected]        main -> main (fetch first)    # the remote has commits you don't
error: failed to push some refs to 'https://github.com/study-group/todo-app.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.             # Git names the fix
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

> [!INFO] A refused push loses nothing
> Your commits stay on your computer, exactly as they were, until a push succeeds.

## Bring commits down {#git-pull}

The fix is in Git's hint. `git pull` brings Sam's commit into your copy:

```bash
~/todo-app (main) $ git pull
From https://github.com/study-group/todo-app
   06f97e4..8c4aa4c  main       -> origin/main    # the remote's main has a newer commit
Merge made by the 'ort' strategy.                  # both sides had new commits, so a merge commit
 reminders.txt | 1 +                               # the file that changed
 1 file changed, 1 insertion(+)
 create mode 100644 reminders.txt                  # reminders.txt is new
```

A pair like `06f97e4..8c4aa4c` is two commit hashes: the commit a branch was on, then the one it's on now.

> [!INFO] A pull is a merge
> `git pull` downloads the remote's new commits, then merges them into the branch you're on. Here both sides had a new commit, so Git made a merge commit. With no commits of your own, it would be a fast-forward.

If you and Sam had changed the same lines, the pull would stop on a conflict, and you'd settle it like any other merge conflict.

## Send commits up {#git-push}

Now you have everything the remote has, so the push goes through:

```bash
~/todo-app (main) $ git push
Enumerating objects: 5, done.                      # progress lines, safe to skim
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), done.
To https://github.com/study-group/todo-app.git     # where your commits went
   8c4aa4c..f8be44c  main -> main                  # your main updated the remote's main
~/todo-app (main) $ git status
On branch main
Your branch is up to date with 'origin/main'.      # nothing left to send

nothing to commit, working tree clean
```

You can also spell out where the commits go. `git push origin main` sends them to `origin`, onto its `main`, and in a clone plain `git push` means the same thing.

> [!TIP] Pull before you push
> Pull before you start work, and again before you push. You'll meet far fewer refused pushes.

```block-exercise
id: build-push
prompt: "Build the command that sends your commits to `main` on `origin`:"
availableBlocks: [ git, push, pull, origin, main, clone, commit ]
correctAnswer: [ git, push, origin, main ]
decoyReasons:
  pull: "`pull` brings commits down, and you want to send yours up."
  clone: "`clone` copies a whole project down, once."
  commit: Committing records work on your computer, and sending it up is the next step.
hints:
  - Start with `git push`, then say where the commits go.
  - The remote is `origin`, and the branch is `main`.
  - The full command is `git push origin main`.
```

```sandbox-exercise
id: remote-round-trip
title: "Practice: a refused push"
mode: guided
brief: Your `todo-app` is the clone you made of the study group's repository. You're about to add tags, and Sam has just pushed reminders. Get your work onto the remote. The remote here is simulated.
seed:
  dir: todo-app
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    setup:
      - story: after-undo-a-change
    ahead:
      - write:
          reminders.txt: |
            remind(tasks)
      - run: git add .
      - run: 'git commit -m "feat: add reminders"'
  setup:
    - run: git config pull.rebase false
goals:
  - id: committed
    label: "`tags.txt` is in a commit"
    narration: >-
      Write the tags feature with `echo "tags = ask()" > tags.txt`, then stage it and commit it. A remote only takes commits. Then try `git push`, and read why Git refuses.
    check:
      kind: commit-exists
      containing: [ tags.txt ]
      onBranch: main
    hints:
      - Write the file, stage it, then commit it.
      - >-
        Run `echo "tags = ask()" > tags.txt`, then `git add tags.txt`.
      - >-
        Then run `git commit -m "feat: add tags"`.
  - id: pulled
    label: Your `main` has Sam's reminders commit
    narration: Sam pushed first, so the remote has a commit you don't. Bring it down with one command, then run `ls` to see what arrived.
    check:
      kind: commit-exists
      messageIncludes: add reminders
      onBranch: main
    hints:
      - The command that brings commits down is `git pull`.
      - Run `git pull`, then `ls` to see `reminders.txt` arrive.
  - id: pushed
    label: Your commits are on the remote
    narration: The remote has nothing you lack now, so push again. Then run `git status` to check you're up to date.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ tags.txt ]
          onBranch: main
        - kind: commit-exists
          messageIncludes: add reminders
          onBranch: main
        - kind: pushed
          branch: main
    hints:
      - Your copy came from a clone, so `origin` is already set and the command needs nothing after it.
      - Run `git push`, then `git status`.
completionMessage: Git refused your push until you had Sam's commit, then took both. Pull, commit, and push is the daily loop with a remote.
```

## Recap {#recap}

You can now:

- Check whether you've pushed with `git status`
- Fix a refused push by pulling first
- Bring new commits down with `git pull`
- Send your commits up with `git push`

```bash
git pull               # bring new commits down and merge them
git push               # send your commits up
git push origin main   # same, naming the remote and branch
git status             # compare your branch with the remote
```

Next up: how a project gets onto GitHub in the first place.
