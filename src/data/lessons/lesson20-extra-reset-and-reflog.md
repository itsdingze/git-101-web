---
id: 20
title: "Extra: Reset and Reflog"
description: Take commits off a branch, and rescue ones you lost
unlocks: [ reset, reflog ]
---

## Take a commit off {#reset-a-commit}

Committed too soon, or committed the wrong thing? If you haven't pushed it yet, `git reset` can take that commit off your branch.

You tell reset which commit the branch should go back to. `HEAD` marks the commit you're on, and `HEAD~1` means one commit before it. This `~` has nothing to do with your home folder: after a commit, `~1` means one step back.

```bash
~/todo-app (main) $ git log --oneline
15490f5 (HEAD -> main) feat: add archive     # the commit to take off
f056eb9 feat: add search                     # HEAD~1, one commit back
08a5946 feat: add task list
~/todo-app (main) $ git reset --soft HEAD~1  # move main back one commit
~/todo-app (main) $ git log --oneline
f056eb9 (HEAD -> main) feat: add search      # the archive commit is off the branch
08a5946 feat: add task list
~/todo-app (main) $ git status
On branch main
Changes to be committed:                     # its changes are still here, staged
  (use "git restore --staged <file>..." to unstage)
	new file:   archive.txt
```

> [!WARNING] Reset only what you haven't pushed
> Reset removes commits from your history. If a teammate already has them, your histories stop matching, so undo pushed commits with `git revert` instead.

## Three ways to reset {#reset-modes visualization=reset-walkthrough}

The commit comes off the branch every time. A flag picks what happens to the changes that were inside it:

```bash
git reset --soft HEAD~1   # undo the commit, keep its changes staged
git reset HEAD~1          # undo the commit, keep its changes unstaged
git reset --hard HEAD~1   # undo the commit and delete its changes
```

`--soft` is the one you just saw. With no flag, the changes stay in your files but leave the staging area. With `--hard`, they leave your folder too:

```bash
~/todo-app (main) $ git reset --hard HEAD~1
HEAD is now at f056eb9 feat: add search      # main moved back one commit
~/todo-app (main) $ ls
app.txt  search.txt                          # archive.txt is gone from the folder
```

> [!DANGER] `--hard` deletes uncommitted work
> If you have changes you haven't committed, `git reset --hard` deletes them for good. Commit or stash first. The commits it drops can still be rescued.

```block-exercise
id: build-reset-soft
prompt: "Build the command that undoes your last commit but keeps its changes staged:"
availableBlocks: [ git, reset, restore, --soft, --hard, HEAD~1, HEAD ]
correctAnswer: [ git, reset, --soft, HEAD~1 ]
decoyReasons:
  restore: "`git restore` works on files, and undoing a commit takes `git reset`."
  --hard: "`--hard` would throw the changes away, and this step keeps them staged."
  HEAD: "`HEAD` is the commit you're on, so resetting to it undoes nothing."
hints:
  - One commit back is `HEAD~1`.
  - The flag that leaves your changes staged is `--soft`.
  - The full command is `git reset --soft HEAD~1`.
```

## Your safety net {#reflog-safety}

Reset a commit away and then realised you needed it? It isn't gone yet.

Every time you commit, switch, merge, or reset, Git writes down where `HEAD` ended up. That list is the **reflog**, short for reference log. It still shows commits that a reset took off your branch:

```bash
~/todo-app (main) $ git reflog   # every move HEAD made, newest first
f056eb9 HEAD@{0}: reset: moving to HEAD~1
15490f5 HEAD@{1}: commit: feat: add archive   # the commit the reset took off
f056eb9 HEAD@{2}: commit: feat: add search
08a5946 HEAD@{3}: commit (initial): feat: add task list
```

Each line starts with a commit's short hash. `HEAD@{1}` means where `HEAD` was one move ago. Your hashes will differ.

> [!WARNING] Rescue lost commits soon
> The reflog lives only on your computer, and Git clears out commits no branch holds after about 30 days.

## Bring a commit back {#rescue-a-commit}

A lost commit only needs a branch pointing at it again. `git switch -c` can start a new branch at any hash, so the hash from the reflog is enough:

```bash
~/todo-app (main) $ git switch -c recovered 15490f5   # new branch, starting at that commit
Switched to a new branch 'recovered'
~/todo-app (recovered) $ ls
app.txt  archive.txt  search.txt                     # archive.txt is back
```

The commit is safe on `recovered`. To put it back on `main` too, merge it in as usual: `git switch main`, then `git merge recovered`.

```sandbox-exercise
id: reflog-rescue
title: "Practice: lose a commit, then bring it back"
mode: guided
brief: "You're in `todo-app`, where `archive.txt` is finished but not committed. You'll commit it, throw the commit away with `git reset --hard`, then rescue it from the reflog."
seed:
  dir: todo-app
  setup:
    - write:
        app.txt: |
          tasks = load()
          show(tasks)
    - run: git init
    - run: git add .
    - run: 'git commit -m "feat: add task list"'
    - write:
        search.txt: |
          query = ask("Search for")
    - run: git add .
    - run: 'git commit -m "feat: add search"'
    - write:
        archive.txt: |
          archive(done_tasks)
goals:
  - id: committed
    label: "`archive.txt` is in a commit called `feat: add archive`"
    narration: >-
      Stage `archive.txt` and commit it with the message `feat: add archive`.
    check:
      kind: commit-exists
      messageIncludes: add archive
    hints:
      - Run `git status` to see that `archive.txt` isn't staged yet.
      - >-
        Run `git add archive.txt`, then `git commit -m "feat: add archive"`.
  - id: destroyed
    label: The commit is off `main`, and `archive.txt` is gone from the folder
    narration: Now break it on purpose with `git reset --hard HEAD~1`. Then run `ls` and `git log --oneline` to see that the file and the commit are gone.
    check:
      kind: all-of
      checks:
        - kind: file-absent
          path: archive.txt
        - kind: commit-count
          count: 2
    hints:
      - One commit back is `HEAD~1`, and the flag that also rewrites your files is `--hard`.
      - Run `git reset --hard HEAD~1`.
  - id: recovered
    label: A branch called `recovered` holds the commit again, and you're on it
    narration: >-
      Run `git reflog`. The line under the reset is your archive commit. Copy its hash and run `git switch -c recovered` followed by it, then `ls`.
    check:
      kind: all-of
      checks:
        - kind: on-branch
          name: recovered
        - kind: file-present
          path: archive.txt
    hints:
      - The `git reflog` command lists every place `HEAD` has been, newest first.
      - Copy the hash at the start of the line just below the `reset` line.
      - Run `git switch -c recovered` followed by that hash.
completionMessage: You lost a commit and brought it back with the reflog. Any commit you made on this computer in the last few weeks is still in there.
```

```quiz
id: quiz-reset-vs-revert
question: You made a commit two minutes ago, and nobody else has it. You want the commit gone but its changes kept. What do you run?
options:
  - text: "`git reset --soft HEAD~1`"
  - text: "`git reset --hard HEAD~1`"
    whyWrong: That removes the commit and deletes its changes too.
  - text: "`git revert HEAD`"
    whyWrong: Revert keeps the commit and adds another that cancels it.
  - text: "`git commit --amend`"
    whyWrong: Amend replaces the commit, so a commit is still there.
correctIndex: 0
explanation: The soft reset takes the commit off and leaves its changes staged.
```

## Recap {#recap}

You can now:

- Take a commit off a branch and choose what happens to its changes
- Rescue a lost commit with `git reflog`
- Tell when reset is safe and when to revert

```bash
git reset --soft HEAD~1           # undo commit, keep changes staged
git reset HEAD~1                  # undo commit, keep changes unstaged
git reset --hard HEAD~1           # undo commit, delete changes
git reflog                        # list everywhere HEAD has been
git switch -c recovered <hash>    # branch at a lost commit
```

Next up: one more extra, checking what's new before you pull.
