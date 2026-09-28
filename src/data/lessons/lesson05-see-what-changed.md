---
id: 5
title: See What Changed
description: Check changed lines before you commit, and read your history
unlocks: [ diff, log, show ]
---

## See the changed lines {#git-diff visualization=diff-walkthrough}

`git status` tells you which files changed, but not what changed inside them. Before you commit, you'll want to check exactly what you're about to record. `git diff` shows you the changed lines.

Let's see it. Twenty tasks still isn't enough for a busy week, so you raise the limit in `settings.txt` once more, to 25:

```bash
~/todo-app (main) $ echo "MAX_TASKS = 25" > settings.txt
~/todo-app (main) $ git diff               # show the lines you changed
diff --git a/settings.txt b/settings.txt    # which file changed
index e1a591a..3c3f1bb 100644             # Git's bookkeeping, safe to skip
--- a/settings.txt                         # the file before your change
+++ b/settings.txt                         # the file after your change
@@ -1 +1 @@                                # where the change is: line 1
-MAX_TASKS = 20                            # - marks a line you removed
+MAX_TASKS = 25                            # + marks a line you added
```

A line you edited shows up twice: the old version with `-`, then the new one with `+`.

> [!INFO] New files don't show here
> `git diff` only compares files Git already tracks. A brand-new file appears in `git status` under `Untracked files`, and not in the diff.

## Check what's staged {#diff-staged}

Plain `git diff` compares your files with what's staged. The `--staged` flag shows what your next commit will record:

```bash
~/todo-app (main) $ git add settings.txt   # stage the change
~/todo-app (main) $ git diff               # prints nothing: no unstaged changes left
~/todo-app (main) $ git diff --staged      # what your next commit will record
diff --git a/settings.txt b/settings.txt
index e1a591a..3c3f1bb 100644
--- a/settings.txt
+++ b/settings.txt
@@ -1 +1 @@
-MAX_TASKS = 20
+MAX_TASKS = 25
~/todo-app (main) $ git commit -m "feat: raise the task limit to 25"   # it's what you meant, so commit
[main 5714454] feat: raise the task limit to 25
 1 file changed, 1 insertion(+), 1 deletion(-)
```

> [!INFO] Plain diff skips staged changes
> Once you stage a change, plain `git diff` stops showing it. `git diff --staged` shows it again.

```block-exercise
id: build-diff-staged
prompt: "Build the command that shows the changes you've staged:"
availableBlocks: [ git, diff, --staged, status, log ]
correctAnswer: [ git, diff, --staged ]
decoyReasons:
  status: "`git status` lists which files changed, not the lines inside them."
  log: "`git log` lists the commits you've already made."
hints:
  - Start with `git diff`.
  - Add the flag that means staged.
  - The full command is `git diff --staged`.
```

## Read your history {#git-log}

That makes three commits. Next week you'll want to know what you changed, and when. `git log` lists every commit, newest first:

```bash
~/todo-app (main) $ git log
commit 5714454eb169120f8f2c40e7c2d9ebf11047554a (HEAD -> main)   # the newest commit's full hash, HEAD explained below
Author: Ada Lovelace <ada@example.com>       # who made it
Date:   Tue Nov 14 22:16:20 2023 +0000       # when

    feat: raise the task limit to 25         # its message

commit 06dfe54228aad12b0ae6e54e6b34291e38817c92   # the commit before it
Author: Ada Lovelace <ada@example.com>
Date:   Tue Nov 14 22:15:20 2023 +0000

    feat: raise the task limit

commit 68cc05c441e3f6cfceeab13814c490f543cbb10d   # your first commit
Author: Ada Lovelace <ada@example.com>
Date:   Tue Nov 14 22:14:20 2023 +0000

    feat: add task list
```

Your hashes, name, and dates will differ. The `--oneline` flag gives one short line per commit:

```bash
~/todo-app (main) $ git log --oneline
5714454 (HEAD -> main) feat: raise the task limit to 25   # short hash, then the message
06dfe54 feat: raise the task limit
68cc05c feat: add task list
```

Your history will soon be longer than a screen. A dash and a number show only that many commits, so `git log --oneline -2` prints the newest two.

> [!TIP] Stuck in the log? Press q
> On your own computer, a long log opens in a viewer you scroll with the arrow keys. Press `q` to get back to the prompt.

## Where you are now {#head}

`(HEAD -> main)` marks the commit you're on now. **`HEAD`** is Git's "you are here" marker, like the dot on a map. It points at `main`, the branch you're on, and `main` points at its newest commit.

Every new commit moves `main` forward, and `HEAD` comes with it. You'll meet both again in a future lesson, when you learn about branches.

## See what a commit changed {#git-show}

`git log` tells you a commit exists. `git show` takes a commit's hash and shows what that commit changed. The short hash from `git log --oneline` is enough:

```bash
~/todo-app (main) $ git show 06dfe54
commit 06dfe54228aad12b0ae6e54e6b34291e38817c92
Author: Ada Lovelace <ada@example.com>
Date:   Tue Nov 14 22:15:20 2023 +0000

    feat: raise the task limit             # the top half is its entry from git log

diff --git a/settings.txt b/settings.txt   # the bottom half is a diff of what it changed
index 5eef9b4..e1a591a 100644
--- a/settings.txt
+++ b/settings.txt
@@ -1 +1 @@
-MAX_TASKS = 10                            # the line before this commit
+MAX_TASKS = 20                            # the line after it
```

With no hash, `git show` shows the newest commit. That's how you find the commit that broke something: read the log, then show each commit you suspect.

```sandbox-exercise
id: review-before-commit
title: "Practice: check before you commit"
mode: guided
brief: "`todo-app` has two commits, and the task limit is 20. You're about to raise it again, and this time you'll check the change before it goes in."
seed:
  dir: todo-app
  setup:
    - story: after-first-commit
goals:
  - id: limit-staged
    label: A new limit in `settings.txt` is staged
    narration: >-
      Change the limit with `echo "MAX_TASKS = 25" > settings.txt`, then run `git diff` to see the old and new lines. Stage it and run `git diff --staged`.
    check:
      kind: files-staged
      paths: [ settings.txt ]
    hints:
      - Change the file first, then look at the change with `git diff`.
      - >-
        Run `echo "MAX_TASKS = 25" > settings.txt`, then `git add settings.txt`.
  - id: limit-committed
    label: The new limit is committed
    narration: Commit it with a `feat:` message. Then run `git log --oneline` to see it on top, and `git show` to read what it changed.
    check:
      kind: commit-count
      count: 3
    hints:
      - Run `git status`, and you'll see the staged change waiting for a commit.
      - >-
        Run `git commit -m "feat: raise the task limit to 25"`.
completionMessage: You checked the change, committed it, and found it at the top of your history. Run `git diff --staged` before every commit and you'll rarely commit by mistake.
```

```quiz
id: quiz-diff
question: You edited a file and haven't run `git add`. What does plain `git diff` show?
options:
  - text: Your changes that aren't staged yet
  - text: Only the changes you've already staged
    whyWrong: That's `git diff --staged`. Plain `git diff` shows the opposite.
  - text: A list of your recent commits
    whyWrong: That's `git log`. `git diff` shows changed lines.
  - text: Every change since your last commit, staged too
    whyWrong: Plain `git diff` leaves out what you've already staged.
correctIndex: 0
explanation: Plain `git diff` shows unstaged edits, and `--staged` shows the rest.
```

## Recap {#recap}

You can now:

- Check the changed lines before you commit
- Read a diff's `-` and `+` lines
- Read your history, newest first
- Spot the commit you're on with `HEAD`
- See what any commit changed

```bash
git diff              # changes not staged yet
git diff --staged     # changes staged for commit
git log               # full history
git log --oneline     # one line per commit
git log --oneline -3  # only the newest three
git show <hash>       # what one commit changed
```

Next up: keeping your own files out of your commits.
