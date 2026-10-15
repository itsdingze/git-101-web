---
id: 4
title: One purpose per commit
description: Stop tracking unwanted files and group changes by purpose
unlocks: [rm]
---

## An unwanted file {#debug-log}

A useful commit has one purpose. In this lesson, you'll separate three changes so each can be understood and undone on its own.

Start with a file that shouldn't have been recorded. Your first commit included `debug.log`. We've added another sample log line, so the file has changed:

```diff ~/projects/todo-app/debug.log
 app started
+app started
```

Logs record messages generated while an app runs. Keeping each new message in Git would clutter the project history, so you'll stop tracking this file.

## Changes ready to commit {#more-changes}

We've also created two new files: `dates.py` for due dates, and `README.md` to describe the project. The editor below shows both:

```diff ~/projects/todo-app/dates.py
+def read_due_dates() -> None:
+    # Read each task's due date.
+    pass
```

```diff ~/projects/todo-app/README.md
+# To-do app
+A small to-do list app for learning Git.
```

A **README** explains what a project does and how to use it. People usually read it first when exploring a project. The `.md` extension means Markdown: plain text with formatting marks, such as `#` for a heading.

We've also added a function outline in `app.py` to show the due dates. Both code files belong to the same feature:

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass

 def show_tasks() -> None:
     # Show all tasks.
     pass
+
+def show_due_dates() -> None:
+    # Show each task's due date.
+    pass
```

## Ignore new log files {#log-rule}

Before committing the prepared changes, you'll deal with the log. We've added a rule to `.gitignore` to keep new log files out of normal staging:

```diff ~/projects/todo-app/.gitignore
 tasks.txt
+*.log
```

The `*` stands for any name, so `*.log` covers every file whose name ends in `.log`.

## Ignore rules and tracked files {#rule-too-late}

To check the new ignore rule, run `git status`. The log is listed in `.gitignore`, but it still appears under `Changes not staged for commit`:

```terminal
~/projects/todo-app (main) $ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .gitignore
	modified:   app.py
	modified:   debug.log  # still listed

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
	dates.py

no changes added to commit (use "git add" and/or "git commit -a")
~/projects/todo-app (main) $
```

Why is it still listed? `.gitignore` applies to untracked files. A file already staged or committed stays tracked when a new rule is added. The rule doesn't remove its staged version or its earlier history.

`debug.log` was in the first commit, so Git still reports its changes. Next, you'll stop tracking it while keeping the local file.

## Stop tracking a file {#untrack}

To stop tracking a file while keeping it on your computer, run `git rm --cached`. `rm` means remove, and `--cached` limits the removal to Git's staged version. Then run `git status` to check the result:

```terminal
~/projects/todo-app (main) $ git rm --cached debug.log  # untrack it
rm 'debug.log'
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	deleted:    debug.log

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .gitignore
	modified:   app.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
	dates.py
~/projects/todo-app (main) $
```

The file is still on your computer, but its removal from the next snapshot is staged. That's why `git status` lists it as `deleted` under `Changes to be committed`.

Once you commit that removal, new commits will leave `debug.log` out, and the `*.log` rule stops Git from staging it again. Earlier commits still hold their saved copy, so you can still see the old `debug.log` by looking back through the history.

```block-exercise
id: build-rm-cached
prompt: "Build the command that stops Git tracking `debug.log`:"
availableBlocks: [ git, rm, add, --cached, -f, debug.log ]
correctAnswer: [ git, rm, --cached, debug.log ]
acceptableAnswers:
  - [ git, rm, debug.log, --cached ]
missingReasons:
  --cached: Without `--cached`, `git rm` refuses here, and forcing it deletes your copy.
decoyReasons:
  add: "`git add` stages a file to be tracked, and here you want Git to stop."
  -f: No force flag is needed to stop tracking this file.
hints:
  - The command that removes a file from Git is `git rm`.
  - Add the flag that leaves your folder alone, then the file name.
  - The full command is `git rm --cached debug.log`.
```

## Choose a message type {#commit-messages}

Each group needs a message that describes its purpose. You've used `feat:` for a feature. Here are the types used in this course:

- `feat:` adds a feature, like `feat: add task list`
- `fix:` fixes a bug, like `fix: stop crash on empty list`
- `docs:` updates documentation, like `docs: add setup notes`
- `chore:` is housekeeping, like `chore: ignore log files`

After the type, describe the change as an instruction, such as `add` or `fix`. This is a common writing convention that we'll use here.

The type labels the kind of change. It doesn't decide what belongs together: two unrelated features can both use `feat:` and still need separate commits.

```quiz
id: quiz-commit-type
question: A change fixes a crash when the to-do list is empty. Which message best follows this course's format and writing style?
options:
  - text: "`fix: stop crash on empty list`"
  - text: "`feat: stop crash on empty list`"
    whyWrong: "`feat:` is for new features, and this fixes a bug."
  - text: "`fix: stopped the crash`"
    whyWrong: Git accepts this wording, but this course uses an instruction such as `stop`. Name the crash more specifically too.
  - text: "`fix: changes`"
    whyWrong: The prefix fits, but `changes` doesn't identify the bug that was fixed.
correctIndex: 0
explanation: In this course, use `fix:` for a bug fix and a specific instruction describing the change.
```

## One purpose per commit {#one-purpose}

The pending changes serve three purposes: stop tracking the log, add due dates, and document the app. Combining them would make it harder to review or undo just one of those changes.

Give each purpose its own commit. After staging a group, run `git status` and check `Changes to be committed` before recording it. The removal of `debug.log` is already staged, so start by adding the ignore rule:

```terminal
~/projects/todo-app (main) $ git add .gitignore
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   .gitignore
	deleted:    debug.log

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   app.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
	dates.py
~/projects/todo-app (main) $ git commit -m "chore: stop tracking debug.log"
[main 7eb0ee6] chore: stop tracking debug.log
 2 files changed, 1 insertion(+), 1 deletion(-)
 delete mode 100644 debug.log
~/projects/todo-app (main) $
```

The staged ignore rule and log removal both tidy up the project. Their `chore:` commit leaves the due-date changes and README for later.

## Commit the due dates {#due-dates-commit}

Next, stage `app.py` and `dates.py` together, because both belong to the due-date feature. `git add` accepts several file names separated by spaces. Check that only those files are staged, then commit:

```terminal
~/projects/todo-app (main) $ git add app.py dates.py
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.py
	new file:   dates.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md
~/projects/todo-app (main) $ git commit -m "feat: add due dates"
[main 03657a4] feat: add due dates
 2 files changed, 7 insertions(+)
 create mode 100644 dates.py
~/projects/todo-app (main) $
```

Only `README.md` remains untracked. It serves a different purpose, so it gets its own commit next.

## Commit the README {#readme-commit}

Finally, stage `README.md` on its own and check the staged list. After its `docs:` commit, run `git status` again to check that all three groups are recorded:

```terminal
~/projects/todo-app (main) $ git add README.md
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   README.md
~/projects/todo-app (main) $ git commit -m "docs: add a README"
[main 4f0f26c] docs: add a README
 1 file changed, 2 insertions(+)
 create mode 100644 README.md
~/projects/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean
~/projects/todo-app (main) $
```

The status is clean. The app, ignore rules, and README are committed.

```quiz
id: quiz-rule-too-late
question: We've added `*.log` to `.gitignore`, but `git status` still lists `debug.log` as modified. Why?
options:
  - text: It was committed before the rule existed
  - text: The rule only starts working once you commit it
    whyWrong: Rules work as soon as `.gitignore` is saved. They affect untracked files, so they don't untrack `debug.log`.
  - text: "`*.log` doesn't match the name `debug.log`"
    whyWrong: "`*` stands for any name, so `*.log` matches every file ending in `.log`."
  - text: Git always lists files whose names end in `.log`
    whyWrong: An ignored untracked log is left out. Here, `debug.log` still appears because Git already tracks it.
correctIndex: 0
explanation: A rule only covers untracked files, so you stop tracking `debug.log` with `git rm --cached`.
```

```quiz
id: quiz-one-purpose
question: "`README.md` has a finished typo fix, and `app.py` has an unrelated, finished feature. How do you record both now, with one purpose per commit?"
options:
  - text: In two commits, each with its own files
  - text: "`git add .`, then one commit with a `feat:` message"
    whyWrong: These changes have separate purposes. Separate commits make each easier to review and undo.
  - text: Commit only `app.py`, and leave the README fix for later
    whyWrong: You can leave it for later, but this question asks you to record both finished changes now. Give the README fix its own commit.
correctIndex: 0
explanation: One purpose per commit keeps each message true and each change easy to undo.
```

```sandbox-exercise
id: one-change-per-commit
title: "Practice: one purpose per commit"
mode: guided
brief: "Your turn: the `*.log` rule, due dates, and the README are all waiting in `todo-app`. Stop tracking `debug.log`, then make three commits with one purpose each."
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-first-commit
    - story: changes-for-lesson-4
goals:
  - id: debug-log-untracked
    label: "Git has stopped tracking `debug.log`, and the local file remains"
    narration: Stop tracking `debug.log` while keeping the local file. Then run `git status` to check that it is no longer listed as modified or untracked.
    check:
      kind: all-of
      checks:
        - kind: file-untracked
          path: debug.log
        - kind: file-present
          path: debug.log
        - kind: last-command
          startsWith: git status
    hints:
      - "`git rm` removes a file from Git, and one flag keeps your copy."
      - Run `git rm --cached debug.log`, then `git status`.
  - id: chore-committed
    label: "The `*.log` rule is in a `chore:` commit"
    narration: Stage `.gitignore` too, then run `git status` to check the rule and log removal are staged together. Commit them with a `chore:` message.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          modifies: [ .gitignore ]
          messageIncludes: chore
        - kind: not
          check: { kind: commit-exists, modifies: [ .gitignore ], containing: [ debug.log ] }
        - kind: not
          check: { kind: commit-exists, modifies: [ .gitignore, app.py ] }
        - kind: not
          check: { kind: commit-exists, modifies: [ .gitignore ], containing: [ dates.py ] }
        - kind: not
          check: { kind: commit-exists, modifies: [ .gitignore ], containing: [ README.md ] }
    hints:
      - Run `git status`, and you'll see the removal is staged but `.gitignore` isn't yet.
      - >-
        Run `git add .gitignore`, then `git status`, then `git commit -m "chore: stop tracking debug.log"`.
  - id: feat-committed
    label: "Due dates are in a `feat:` commit of their own"
    narration: Now stage `app.py` and `dates.py`, check the staged list with `git status`, and commit them with a `feat:` message.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          modifies: [ app.py ]
          containing: [ dates.py ]
          messageIncludes: feat
        - kind: not
          check: { kind: commit-exists, modifies: [ app.py ], containing: [ README.md ] }
        - kind: not
          check: { kind: commit-exists, modifies: [ app.py, .gitignore ] }
    hints:
      - "`git add` takes several file names, with spaces between them."
      - >-
        Run `git add app.py dates.py`, then `git status`, then `git commit -m "feat: add due dates"`.
  - id: docs-committed
    label: "The README is in a `docs:` commit, and nothing is left to commit"
    narration: Stage `README.md` alone and check the staged list. Make a `docs:` commit, then run `git status` to check for remaining changes.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ README.md ]
          messageIncludes: docs
        - kind: not
          check: { kind: commit-exists, containing: [ README.md ], modifies: [ app.py ] }
        - kind: not
          check: { kind: commit-exists, containing: [ README.md ], modifies: [ .gitignore ] }
        - kind: working-tree-clean
        - kind: last-command
          startsWith: git status
    hints:
      - Stage just `README.md` this time.
      - >-
        Run `git add README.md`, then `git status`, then `git commit -m "docs: add a README"`, then `git status`.
detours:
  - id: debug-log-deleted
    check: { kind: file-absent, path: debug.log }
    message: "`debug.log` is gone from your folder, because `git rm -f` deletes your copy. Press Start over, and run `git rm --cached debug.log`."
  - id: changes-mixed
    check:
      kind: any-of
      checks:
        - { kind: commit-exists, modifies: [ app.py ], containing: [ README.md ] }
        - { kind: commit-exists, modifies: [ .gitignore, app.py ] }
        - { kind: commit-exists, modifies: [ .gitignore ], containing: [ dates.py ] }
        - { kind: commit-exists, modifies: [ .gitignore ], containing: [ README.md ] }
    message: That commit mixes changes with different purposes. Press Start over, and stage only the files for one change before each commit.
  - id: debug-log-still-tracked
    check: { kind: commit-exists, modifies: [ .gitignore ], containing: [ debug.log ] }
    message: "That commit has the `*.log` rule, but Git still tracks `debug.log`. Press Start over, and run `git rm --cached debug.log` before you commit."
  - id: changes-mixed-staged
    check:
      kind: any-of
      checks:
        - { kind: files-staged, paths: [ .gitignore, app.py ] }
        - { kind: files-staged, paths: [ .gitignore, dates.py ] }
        - { kind: files-staged, paths: [ .gitignore, README.md ] }
        - { kind: files-staged, paths: [ debug.log, app.py ] }
        - { kind: files-staged, paths: [ debug.log, dates.py ] }
        - { kind: files-staged, paths: [ debug.log, README.md ] }
        - { kind: files-staged, paths: [ app.py, README.md ] }
        - { kind: files-staged, paths: [ dates.py, README.md ] }
    message: Changes with different purposes are staged together, so your next commit would mix them. Press Start over, and stage only the files for one change.
  - id: rule-left-out
    check:
      kind: all-of
      checks:
        - { kind: file-untracked, path: debug.log }
        - kind: not
          check: { kind: files-staged, paths: [ debug.log ] }
        - kind: not
          check: { kind: files-staged, paths: [ .gitignore ] }
        - kind: not
          check: { kind: commit-exists, modifies: [ .gitignore ] }
    message: "That commit stopped tracking `debug.log`, but `.gitignore` was left out, so the `*.log` rule isn't committed. Run `git add .gitignore`, then commit it with a `chore:` message."
completionMessage: Each of your commits has one purpose. `debug.log` is still in your folder, and Git ignores it now.
```

## Recap {#recap}

You can now:

- Explain why ignore rules don't untrack files
- Stop tracking a file and keep your copy
- Stage only the files that belong together
- Give each commit one purpose

```bash
git rm --cached <file>         # stop tracking, keep your copy
git add <file> <file>          # stage only these files
git commit -m "chore: ..."     # housekeeping, like ignore rules
```

Next up: keeping an experiment on its own branch.
