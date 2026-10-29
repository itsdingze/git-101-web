---
id: 7
title: Read your history
description: Read commit history and inspect changes before committing
unlocks: [show, diff]
---

## Find an earlier change {#why-history}

Suppose you want to check how the due-date bug was fixed. First, find the fix in the commit history with `git log`. Then use `git show` to see the lines that commit changed.

## Read the commit history {#git-log}

By default, `git log` follows the history leading to your current commit. Each entry shows a hash, author, date, and message. Add a dash and a number to limit the list:

```terminal
~/projects/todo-app (main) $ git log -3  # only the newest three
commit a75a159b3b1c84cb9a93cc1465ecf2cae16a9eb8 (HEAD -> main)
Author: Ada Lovelace <ada@example.com>  # who made it
Date:   Tue Nov 14 22:21:20 2023 +0000  # when

    feat: add priorities  # its message

commit 672451221b8010324c5d8fb016c43e962d9b5896
Merge: f2b35de 533373d  # the commits it joined
Author: Ada Lovelace <ada@example.com>  # who made it
Date:   Tue Nov 14 22:20:20 2023 +0000

    Merge branch 'add-search'

commit f2b35de0722a7eaed2580b41ddbc7dbcbfdd4f95
Author: Ada Lovelace <ada@example.com>  # who made it
Date:   Tue Nov 14 22:19:20 2023 +0000

    fix: hide due dates on finished tasks  # the fix
~/projects/todo-app (main) $
```

Each entry starts with the commit's full hash. Your hashes and name will be different.

`(HEAD -> main)` marks where you are, as it did in the graph: `HEAD` points at `main`, and `main` points at its newest commit.

The fix's entry answers your first question: its date says when, and its message says what it fixed.

## Find the fix {#oneline}

You've already used `--oneline` in the branch graph. Here, use it without `--graph` to scan commit messages for the due-dates fix:

```terminal
~/projects/todo-app (main) $ git log --oneline
a75a159 (HEAD -> main) feat: add priorities
6724512 Merge branch 'add-search'
f2b35de fix: hide due dates on finished tasks
533373d feat: add search
4f0f26c docs: add a README
03657a4 feat: add due dates
7eb0ee6 chore: stop tracking debug.log
8c7821f feat: add task list
~/projects/todo-app (main) $
```

Use the short hash at the start of a line to identify a commit. Git may show more than seven characters to keep each short hash unique.

Because each commit has one purpose, each line tells you what one change did, and the fix is easy to spot.

## What a commit changed {#git-show}

`git show` takes a hash and shows that commit: its log entry on top, then the lines it changed:

```terminal
~/projects/todo-app (main) $ git show f2b35de
commit f2b35de0722a7eaed2580b41ddbc7dbcbfdd4f95
Author: Ada Lovelace <ada@example.com>
Date:   Tue Nov 14 22:19:20 2023 +0000

    fix: hide due dates on finished tasks

diff --git a/dates.py b/dates.py  # the file it changed
index d179812..3e16e79 100644
--- a/dates.py  # the file before the commit
+++ b/dates.py  # the file after it
@@ -1,3 +1,4 @@
 def read_due_dates() -> None:
     # Read each task's due date.
+    # Skip finished tasks.
     pass
~/projects/todo-app (main) $
```

Read the bottom half like the file previews in this course. A line starting with `+` was added, and a line starting with `-` was removed.

If a commit edits a line, you see it twice: the old version with `-`, then the new one with `+`.

## Inspect unstaged changes {#git-diff}

You've inspected a committed change. Next, you'll review an uncommitted change before recording it.

We've added a function outline in `app.py` for sorting tasks by due date. Before committing it, you'll inspect the changed lines with `git diff`:

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass

 def show_tasks() -> None:
     # Show all tasks.
     pass

 def show_due_dates() -> None:
     # Show each task's due date.
     pass

 def show_search() -> None:
     # Show a search box.
     pass

 def sort_by_priority() -> None:
     # Sort tasks by priority.
     pass
+
+def sort_by_due_date() -> None:
+    # Sort tasks by due date.
+    pass
```

`git status` tells you which files changed, but not what changed inside them. Plain `git diff` shows unstaged changes to tracked files. It doesn't show the contents of new, untracked files.

Read its added and removed lines as you did with `git show`. Diff is short for difference:

```terminal
~/projects/todo-app (main) $ git diff
diff --git a/app.py b/app.py
index bd00b1a..dbd30f3 100644
--- a/app.py
+++ b/app.py
@@ -17,3 +17,7 @@ def show_search() -> None:
 def sort_by_priority() -> None:
     # Sort tasks by priority.
     pass
+
+def sort_by_due_date() -> None:
+    # Sort tasks by due date.
+    pass
~/projects/todo-app (main) $
```

Git shows a few unchanged lines around each change, so you can tell where in the file it is.

The `@@` line gives the line numbers of what's shown. After them, Git adds the nearest unindented line above, here `def show_search() -> None:`, as a landmark.

## Check, then commit {#check-then-commit}

For tracked files, `git diff` compares working contents with staged contents. When they match, it prints nothing.

`git diff --staged` compares the staged snapshot with the last commit. Use it to review what your next commit will change:

```terminal
~/projects/todo-app (main) $ git add app.py
~/projects/todo-app (main) $ git diff  # all staged
~/projects/todo-app (main) $ git diff --staged  # what you've staged
diff --git a/app.py b/app.py
index bd00b1a..dbd30f3 100644
--- a/app.py
+++ b/app.py
@@ -17,3 +17,7 @@ def show_search() -> None:
 def sort_by_priority() -> None:
     # Sort tasks by priority.
     pass
+
+def sort_by_due_date() -> None:
+    # Sort tasks by due date.
+    pass
~/projects/todo-app (main) $ git commit -m "feat: sort tasks by due date"
[main 71779aa] feat: sort tasks by due date
 1 file changed, 4 insertions(+)
~/projects/todo-app (main) $
```

The staged diff contains only the sorting function, so the commit records that change. Checking this output before each commit helps catch missing or unrelated edits.

## Update a staged version {#restage-a-file}

As you saw when making your first commit, staging keeps a copy of a file's contents at that moment. Later edits need staging again.

For a separate example, suppose the sorting change is staged, then we clarify its comment before the commit:

```diff ~/projects/todo-app/app.py
 def sort_by_due_date() -> None:
-    # Sort tasks by due date.
+    # Sort tasks by due date, earliest first.
     pass
```

Committing now would record the original comment without the new change. To include the clarified comment, run `git add app.py` again, then inspect the updated staged version with `git diff --staged`.

```quiz
id: quiz-staged-version
question: You stage `app.py`, then its contents change again. Which version will the next commit record without another `git add`?
options:
  - text: The version staged before the latest edit
  - text: The newest version currently in the working file
    whyWrong: The latest edit is only in the working file. Run `git add` again to update the staged copy.
  - text: Both versions together in the same commit
    whyWrong: The commit uses the staged version, not both versions of the file.
correctIndex: 0
explanation: Staging preserves a file version. Later edits need another `git add` to be included.
```

```quiz
id: quiz-diff-after-add
question: You stage the current `app.py` with `git add` and make no further edits. What does plain `git diff` show?
options:
  - text: Nothing
  - text: Your change to `app.py`
    whyWrong: Plain `git diff` shows only changes you haven't staged.
  - text: What your last commit changed
    whyWrong: That's `git show`. `git diff` shows changes you haven't staged.
correctIndex: 0
explanation: Your change is staged, so plain `git diff` has nothing left to show. `git diff --staged` shows it.
```

```quiz
id: quiz-see-a-commit
question: You want to see which lines the due-dates fix changed. What do you run?
options:
  - text: "`git show` with the fix's hash"
  - text: "`git log --oneline`"
    whyWrong: That lists your commits, one line each, without the lines they changed.
  - text: "`git diff`"
    whyWrong: "`git diff` shows changes you haven't staged, and the fix is already committed."
  - text: "`git status`, then look for `dates.py`"
    whyWrong: "`git status` lists uncommitted changes only."
correctIndex: 0
explanation: "`git show` prints a commit's log entry and the lines it changed."
```

```sandbox-exercise
id: read-your-history
title: "Practice: read your history"
mode: guided
brief: "Your turn: first, find the due-dates fix in the history and inspect it. Then review a separate, uncommitted change: sorting by due date in `app.py`. Stage and commit that change."
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-undo-changes
    - story: changes-for-lesson-7
goals:
  - id: log-read
    label: You've listed your commits, one line each
    narration: List your commits one line each, and find the due-dates fix.
    check: { kind: last-command, startsWith: git log --oneline }
    hints:
      - "`git log` lists your commits, and one flag puts each on a single line."
      - Run `git log --oneline`.
  - id: fix-shown
    label: You've seen what the fix changed
    narration: Show the fix commit, using the hash at the start of its line.
    check: { kind: last-command, startsWith: git show, namesCommit: { messageIncludes: "fix: hide due dates" } }
    hints:
      - >-
        Use the short hash before `fix: hide due dates on finished tasks`.
      - Run `git show <hash>`, with the fix's hash in place of `<hash>`.
  - id: diff-seen
    label: You've inspected the sorting function
    narration: Now review the uncommitted sorting change. Run `git diff` to inspect the function we added to `app.py`.
    check:
      kind: any-of
      checks:
        - kind: all-of
          checks:
            - { kind: last-command, startsWith: git diff }
            - kind: not
              check: { kind: last-command, startsWith: git diff --staged }
            - kind: not
              check: { kind: files-staged, paths: [ app.py ] }
            - kind: not
              check: { kind: working-tree-clean }
        - kind: all-of
          checks:
            - { kind: last-command, startsWith: git diff --staged }
            - { kind: files-staged, paths: [ app.py ] }
    hints:
      - The command that shows changed lines you haven't staged is short for difference.
      - Run `git diff`.
  - id: sorting-committed
    label: "Sorting is committed with a `feat:` message"
    narration: Stage `app.py`, inspect it with `git diff --staged`, then commit it with a `feat:` message.
    check:
      kind: all-of
      checks:
        - { kind: commit-count, count: 9 }
        - { kind: head-message, includes: "feat:" }
        - kind: working-tree-clean
    hints:
      - Stage the file first, then commit.
      - >-
        Run `git add app.py`, then `git diff --staged`, then `git commit -m "feat: sort tasks by due date"`.
detours:
  - id: committed-before-diff
    untilGoal: diff-seen
    check: { kind: commit-count, count: 9 }
    message: You committed before looking with `git diff`, so it has nothing left to show. Press Start over, and run `git diff` before `git add`.
  - id: staged-before-diff
    untilGoal: diff-seen
    check: { kind: files-staged, paths: [ app.py ] }
    message: "`app.py` is staged, so plain `git diff` shows nothing. Run `git diff --staged` to see your change."
  - id: not-a-feature
    check:
      kind: all-of
      checks:
        - { kind: commit-count, count: 9 }
        - kind: not
          check: { kind: head-message, includes: "feat:" }
    message: >-
      Sorting is a new feature, so its message starts with `feat:`. Fix the message with `git commit --amend -m "feat: sort tasks by due date"`.
completionMessage: You found the fix, inspected its changed lines, and reviewed the sorting change before committing it.
```

## Recap {#recap}

You can now:

- Read your history, newest first
- Find a commit by its message
- See what any commit changed
- Check your changes before you commit them

```bash
git log                # history leading to your current commit
git log --oneline      # one line per commit
git log -3             # only the newest three
git show <hash>        # what one commit changed
git diff               # unstaged changes to tracked files
git diff --staged      # changes staged for commit
```

Next up: sending your commits to the practice GitHub.
