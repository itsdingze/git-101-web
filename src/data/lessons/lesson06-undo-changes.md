---
id: 6
title: Undo changes
description: Discard unstaged edits and correct your last unshared commit
unlocks: [restore]
---

## A change you don't want {#grid-layout}

We've changed a comment in `app.py` to describe a grid layout instead of a list. The editor shows the file as it is now. You'll discard this unwanted edit and return to the last committed version:

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass

 def show_tasks() -> None:
     # Show tasks in a grid.
     pass

 def show_due_dates() -> None:
     # Show each task's due date.
     pass

 def show_search() -> None:
     # Show a search box.
     pass
```

`git status` shows what changed since that commit:

```terminal
~/projects/todo-app (main) $ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   app.py  # the grid

no changes added to commit (use "git add" and/or "git commit -a")
~/projects/todo-app (main) $
```

Git's own hint already names the command: `git restore`.

## Discard unstaged edits {#restore}

To bring back the list comment, use `git restore app.py`. It replaces the file's working contents with its staged version. Here, that version matches the last commit because the grid edit hasn't been staged.

Read the changed comment above and check `git status` before discarding it. Status tells you which files have changes, but it doesn't show the changed lines.

> [!DANGER] The grid edit will be discarded
> This discards the grid edit. It was never staged or committed, so Git has no copy of it to bring back.

```terminal
~/projects/todo-app (main) $ git restore app.py
~/projects/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean  # last commit restored
~/projects/todo-app (main) $
```

After the command, check `app.py` again. It now matches the last commit, with `# Show all tasks.` back in place of the grid comment:

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
```

To discard unstaged edits in every tracked file in this folder and its subfolders, use `git restore .`. Check all those edits before using the broader command.

## Unstage, then discard {#restore-other-files}

What if the unwanted edit is already staged? First run `git restore --staged app.py`. This resets the staged version to the last commit and leaves the edit in your working file.

Stop there if you want to keep editing or commit it later. To discard it too, run `git restore app.py`.

In this separate example, the grid edit starts staged. The first command leaves it in the working file, and the second restores the last committed contents:

```terminal
~/projects/todo-app (main) $ git restore --staged app.py
~/projects/todo-app (main) $ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   app.py

no changes added to commit (use "git add" and/or "git commit -a")
~/projects/todo-app (main) $ git restore app.py
~/projects/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean
~/projects/todo-app (main) $
```

> [!INFO] Untracked files aren't restored
> `git restore` can't discard changes to an untracked file. It has no staged version for the command to bring back.

```sandbox-exercise
id: undo-a-layout
title: "Practice: discard layout edits"
mode: guided
brief: "Your turn: the grid layout is in `app.py`, and you don't want it. Take the project back to your last commit."
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-branches-and-merging
    - story: changes-for-lesson-6a
goals:
  - id: status-checked
    label: You've seen what changed since your last commit
    narration: Run `git status` to see what changed since the last commit.
    check: { kind: last-command, startsWith: git status }
    hints:
      - The command that lists your changes is `git status`.
      - Run `git status`.
  - id: grid-restored
    label: "`app.py` is back to your last commit"
    narration: Discard the grid, and take `app.py` back to your last commit.
    check:
      kind: all-of
      checks:
        - { kind: file-has-line, path: app.py, line: "    # Show all tasks." }
        - kind: not
          check: { kind: file-has-line, path: app.py, line: "    # Show tasks in a grid." }
        - kind: working-tree-clean
    hints:
      - "Git's hint in `git status` names the command that discards changes."
      - If you staged `app.py`, unstage it first with `git restore --staged app.py`.
      - Run `git restore app.py` to discard the grid edit.
  - id: clean-checked
    label: Nothing is left to commit
    narration: Run `git status` again to check that nothing is left to commit.
    check: { kind: last-command, startsWith: git status }
    hints:
      - Use the same command as at the start.
      - Run `git status`.
detours:
  - id: grid-committed
    check:
      kind: not
      check: { kind: commit-count, count: 7 }
    message: The grid edit is now committed. This exercise is about discarding an uncommitted edit. Press Start over, then use `git restore app.py`.
  - id: grid-staged
    check: { kind: files-staged, paths: [ app.py ] }
    message: "The grid edit is staged, so plain restore would keep that version. Run `git restore --staged app.py`, then `git restore app.py` to discard it."
completionMessage: The grid is gone, and your project matches your last commit again.
```

## Add task priorities {#hurried-commit}

The unwanted layout edit is gone. Next, we'll use a task priorities feature to show how to correct a commit that's missing a file. We've added function outlines in `app.py` and a new file, `priority.py`, for sorting tasks and asking how important each task is:

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
+
+def sort_by_priority() -> None:
+    # Sort tasks by priority.
+    pass
```

```diff ~/projects/todo-app/priority.py
+def ask_priority() -> None:
+    # Ask how important each task is.
+    pass
```

## Check the priorities commit {#check-priorities}

Both files belong to the priorities feature. In this example, we've made an incomplete commit by staging only `app.py` and misspelling `priorities` in its message. The transcript shows that commit, followed by the checks that reveal both mistakes:

```terminal
~/projects/todo-app (main) $ git add app.py
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	priority.py
~/projects/todo-app (main) $ git commit -m "feat: add priorites"
[main e9d1ac6] feat: add priorites
 1 file changed, 4 insertions(+)
~/projects/todo-app (main) $ git status
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	priority.py  # not committed

nothing added to commit but untracked files present (use "git add" to track)
~/projects/todo-app (main) $ git log --oneline -2  # newest two
e9d1ac6 (HEAD -> main) feat: add priorites
6724512 Merge branch 'add-search'
~/projects/todo-app (main) $
```

The status still lists `priority.py` as untracked, and the log shows `priorites` in the message. The next practice starts at this point, with that incomplete commit already made.

## Fix the last commit {#amend}

To include the missing file and correct the typo without adding a second priorities commit, **amend** the last commit. Amend means correct.

`git commit --amend` replaces the last commit with a new one that includes your staged changes.

Only amend a commit that's still just on your computer. Later in the course, you'll share commits with others through GitHub. Once someone else has a copy of a commit, replacing it leaves you with different versions of the history.

The priorities commit hasn't been shared, so you can amend it. Stage the missing file, check the staged list with `git status`, then use `-m` to replace the message too:

```terminal
~/projects/todo-app (main) $ git add priority.py
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   priority.py
~/projects/todo-app (main) $ git commit --amend -m "feat: add priorities"
[main a75a159] feat: add priorities
 Date: Tue Nov 14 22:21:20 2023 +0000  # the original's date
 2 files changed, 7 insertions(+)
 create mode 100644 priority.py
~/projects/todo-app (main) $ git log --oneline -2
a75a159 (HEAD -> main) feat: add priorities  # a new hash
6724512 Merge branch 'add-search'
~/projects/todo-app (main) $
```

There's still only one priorities commit, now with the right message and both files. The `Date:` line shows that it keeps the date of the original.

The corrected commit has a new hash, `a75a159` instead of `e9d1ac6`, because it's a new commit that replaced the old one.

```block-exercise
id: build-amend
prompt: Build the command that replaces your last commit with one that has the right message.
availableBlocks: [ git, commit, --amend, -m, "\"feat: add priorities\"", add, restore ]
correctAnswer: [ git, commit, --amend, -m, "\"feat: add priorities\"" ]
acceptableAnswers:
  - [ git, commit, -m, "\"feat: add priorities\"", --amend ]
missingReasons:
  --amend: Without `--amend`, Git adds a second commit instead of replacing the last one.
decoyReasons:
  add: "`git add` stages files, and it leaves the message as it is."
  restore: "`git restore` discards changes you haven't staged."
hints:
  - Start with `git commit`.
  - Add the flag that replaces the last commit, then the new message.
  - >-
    The full command is `git commit --amend -m "feat: add priorities"`.
```

```quiz
id: quiz-restore
question: "An edit to `app.py` was never staged or committed. You run `git restore app.py`. What happens to that edit?"
options:
  - text: Discarded from the working file
  - text: Saved in a commit you can go back to
    whyWrong: You never committed the change, so no commit holds it.
  - text: Staged, ready for your next commit
    whyWrong: "`git restore` discards the change. It doesn't stage anything."
correctIndex: 0
explanation: Restore discards this unstaged edit. No commit contains it.
```

```quiz
id: quiz-amend
question: You just made a commit you haven't shared, then noticed a missing file. How do you include it in that commit?
options:
  - text: Stage it, then amend the commit
  - text: Amend first, then stage the file
    whyWrong: Amend picks up only what's already staged, so the file stays out.
  - text: Make a second commit with the same message
    whyWrong: That works, but now one change is split across two commits.
correctIndex: 0
explanation: "`git commit --amend` replaces your last commit with what's staged now."
```

```sandbox-exercise
id: fix-the-last-commit
title: "Practice: fix the last commit"
mode: guided
brief: "We've prepared an incomplete priorities commit. The message says `priorites`, and `priority.py` was left out. Stage the missing file and replace that commit with a corrected one."
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-branches-and-merging
    - story: lesson-6b-hurried-commit
goals:
  - id: priority-staged
    label: "`priority.py` is staged"
    narration: Amend includes staged changes, so stage the missing file and check the staged list with `git status`.
    check: { kind: files-staged, paths: [ priority.py ] }
    hints:
      - Run `git status` to find the file that was left out.
      - Run `git add priority.py`, then `git status`.
  - id: commit-amended
    label: "One priorities commit holds both files, with the right message"
    narration: >-
      Replace the last commit with one whose message is `feat: add priorities`. Then run `git log --oneline` to check there's only one priorities commit.
    check:
      kind: all-of
      checks:
        - { kind: head-message, includes: "feat: add priorities" }
        - { kind: commit-exists, containing: [ priority.py ], messageIncludes: "feat: add priorities" }
        - { kind: commit-count, count: 8 }
        - kind: working-tree-clean
        - { kind: last-command, startsWith: git log }
    hints:
      - The flag that replaces the last commit is `--amend`.
      - >-
        Run `git commit --amend -m "feat: add priorities"`, then `git log --oneline`.
detours:
  - id: extra-commit
    check:
      kind: not
      check: { kind: commit-count, count: 8 }
    message: That made a second priorities commit instead of replacing the first. Press Start over. After you stage the file, use `git commit --amend`.
  - id: amended-before-add
    check:
      kind: all-of
      checks:
        - { kind: last-command, startsWith: git commit --amend, allowFailure: true }
        - { kind: file-untracked, path: priority.py }
    message: >-
      `priority.py` isn't in the commit, because amend only takes what's staged. Run `git add priority.py`, then amend again.
completionMessage: You have one priorities commit, with the right message and both files in it.
```

## Recap {#recap}

You can now:

- Discard unwanted unstaged edits
- Unstage a file and keep your edit
- Add a forgotten file to your last commit
- Fix your last commit's message

```bash
git restore <file>            # replace working contents with staged version
git restore .                 # same, for tracked files here
git restore --staged <file>   # unstage, keep your edit
git commit --amend -m "..."   # replace your latest unshared commit
```

Next up: reading your history to find when and why something changed.
