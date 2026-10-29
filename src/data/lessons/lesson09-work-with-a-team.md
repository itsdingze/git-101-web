---
id: 9
title: Work with a team
description: Share changes on a branch and merge them after review
unlocks: [pull]
---

## Sam joins {#sam-joins}

Sam Rivera has cloned `todo-app` from the practice GitHub repository. Both computers now have a copy of the project, and you'll share new commits through GitHub.

You and Sam agree to keep `main` for reviewed work. Each new change goes on a separate branch, where the other person can review it before it joins `main`.

## The team workflow {#team-loop}

A **pull request** proposes merging a branch into another branch on GitHub. It gives teammates a place to read the changes, discuss them, and approve them before they reach `main`.

Here is what the workflow usually looks like:

1. Switch to `main` and bring in the latest commits from GitHub.
2. Create a branch, then make your change.
3. Stage the changed files, review their staged contents, and commit.
4. Push the branch and open a pull request.
5. Ask a teammate to review it and address their feedback.
6. After approval, merge the pull request into `main`.

## The export feature {#export-changes}

We've created `export.py` and added a function outline in `app.py` for an export button:

```diff ~/projects/todo-app/export.py
+def export_tasks() -> None:
+    # Save the tasks to tasks.csv.
+    pass
```

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

 def sort_by_due_date() -> None:
     # Sort tasks by due date.
     pass
+
+def show_export() -> None:
+    # Show a button to export tasks.
+    pass
```

These two files describe one feature: exporting tasks.

## Pull before you start {#git-pull}

To start a branch from the latest shared work, first update local `main` with `git pull`. In this course, pull downloads new commits from the paired branch on `origin` and merges them into the branch you're on when needed.

```terminal
~/projects/todo-app (main) $ git switch main
M	app.py  # the prepared export change
Already on 'main'
Your branch is up to date with 'origin/main'.
~/projects/todo-app (main) $ git pull
Already up to date.  # nobody has pushed anything new
~/projects/todo-app (main) $
```

`Already up to date.` means there's no new work to bring in. Local `main` is ready as the starting point for the export branch.

## Commit on the branch {#commit-on-branch}

Create `add-export` from the current `main`. The prepared edits stay in the working directory when you switch to this new branch.

Stage `app.py` and `export.py` together. Check the file list with `git status` and the contents with `git diff --staged`, then commit the feature:

```terminal
~/projects/todo-app (main) $ git switch -c add-export
Switched to a new branch 'add-export'
~/projects/todo-app (add-export) $ git add export.py app.py
~/projects/todo-app (add-export) $ git status
On branch add-export
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.py
	new file:   export.py
~/projects/todo-app (add-export) $ git diff --staged
diff --git a/app.py b/app.py
index dbd30f3..667c702 100644
--- a/app.py
+++ b/app.py
@@ -21,3 +21,7 @@ def sort_by_priority() -> None:
 def sort_by_due_date() -> None:
     # Sort tasks by due date.
     pass
+
+def show_export() -> None:
+    # Show a button to export tasks.
+    pass
diff --git a/export.py b/export.py
new file mode 100644
index 0000000..c999f38
--- /dev/null
+++ b/export.py
@@ -0,0 +1,3 @@
+def export_tasks() -> None:
+    # Save the tasks to tasks.csv.
+    pass
~/projects/todo-app (add-export) $ git commit -m "feat: add export"
[add-export 8c8f4de] feat: add export
 2 files changed, 7 insertions(+)
 create mode 100644 export.py
~/projects/todo-app (add-export) $
```

The export commit is now on `add-export`. Next, send that branch to GitHub so Sam can review it.

## Push the feature branch {#push-export}

Run the first push with `-u` to pair local `add-export` with `add-export` on `origin`:

```terminal
~/projects/todo-app (add-export) $ git push -u origin add-export
Enumerating objects: 6, done.
Counting objects: 100% (6/6), done.
Writing objects: 100% (4/4), done.
remote:
remote: Create a pull request for 'add-export' on GitHub by visiting:
remote:      https://github.com/your-username/todo-app/pull/new/add-export
remote:
To https://github.com/your-username/todo-app.git
 * [new branch]      add-export -> add-export
branch 'add-export' set up to track 'origin/add-export'.
~/projects/todo-app (add-export) $
```

GitHub now has the branch. The `remote:` lines offer a link to open a pull request on the website. You'll create the same request with `gh` next.

## Open a pull request {#pr-create}

The branch is ready for review. Use `gh pr create` to propose merging it into `main`. In `gh` commands, `pr` stands for pull request.

`--title` names the change, and `--body` describes it.

Then run `gh pr view` to read the request and check Sam's review:

```terminal
~/projects/todo-app (add-export) $ gh pr create --title "feat: add export" --body "Adds a button that saves your tasks to a file."
Creating pull request for add-export into main in your-username/todo-app

https://github.com/your-username/todo-app/pull/1
~/projects/todo-app (add-export) $ gh pr view
feat: add export your-username/todo-app#1
Open • your-username wants to merge 1 commit into main from add-export • less than a minute ago
+7 -0
Reviewers: sam-rivera (Approved)

  Adds a button that saves your tasks to a file.

View this pull request on GitHub: https://github.com/your-username/todo-app/pull/1
~/projects/todo-app (add-export) $
```

The URL opens pull request `1`. `+7 -0` means the branch adds seven lines and removes none. Sam's `Approved` review means Sam has accepted the change. In this practice, you can now merge it.

Sam approves automatically in this practice. A teammate may need time to review, so wait for approval and address any feedback before merging.

## Merge the pull request {#pr-merge}

Sam has approved the change, so merge pull request `1`. `--merge` records a merge commit, and `--delete-branch` removes the finished feature branch locally and on GitHub.

Here, `gh` also returns to `main` and brings in the merged commit. Check the result with `git log`:

```terminal
~/projects/todo-app (add-export) $ gh pr merge 1 --merge --delete-branch
✓ Merged pull request your-username/todo-app#1 (feat: add export)
Switched to branch 'main'
From https://github.com/your-username/todo-app
 * branch            main       -> FETCH_HEAD
   40f6f13..6f7869c  main       -> origin/main
Updating 40f6f13..6f7869c
Fast-forward
 app.py    | 4 ++++
 export.py | 3 +++
 2 files changed, 7 insertions(+)
 create mode 100644 export.py
Deleted branch add-export (was 8c8f4de).
✓ Deleted local branch add-export and switched to branch main
✓ Deleted remote branch add-export
~/projects/todo-app (main) $ git log --oneline -3
6f7869c (HEAD -> main, origin/main) Merge pull request #1 from your-username/add-export
8c8f4de (origin/add-export) feat: add export
40f6f13 feat: sort tasks by due date
~/projects/todo-app (main) $
```

The log now shows the merge commit and export commit in `main`'s history. Both local `main` and GitHub's `main` include the feature.

`origin/add-export` beside the older commit is a local record of the remote branch's last position. The feature branch itself has been deleted.

```quiz
id: quiz-first-move
question: Sam asks you to add a print button. Sam merged two changes since you last pulled. What do you do first?
options:
  - text: Switch to `main` and pull
  - text: Commit the button straight to `main`
    whyWrong: You and Sam agreed to review changes on a branch before merging them into `main`. First, update your local `main`.
  - text: Make the branch, and pull later
    whyWrong: Your branch would start from an old `main`, without Sam's two changes.
correctIndex: 0
explanation: Pulling first lets you create your branch from the latest `main` on GitHub.
```

```quiz
id: quiz-pull-vs-push
question: Sam merged a change on GitHub. Which command brings it to your laptop?
options:
  - text: "`git pull`"
  - text: "`git push`"
    whyWrong: Pushing sends your commits up. It doesn't bring anything down.
  - text: "`gh pr create`"
    whyWrong: That opens a pull request for your own branch.
correctIndex: 0
explanation: "`git pull` brings down new commits and merges them into your branch."
```

```sandbox-exercise
id: export-pull-request
title: "Practice: share a change"
mode: guided
brief: "We've prepared export changes, still uncommitted. You're on `main`. Follow the team workflow, from pulling `main` to merging a pull request. Sam reviews it here as soon as you open it."
seed:
  dir: projects/todo-app
  github: { signedIn: true, teammateApproves: true }
  remote:
    name: origin
    url: https://github.com/your-username/todo-app.git
    setup:
      - story: team-after-put-it-on-github
  setup:
    - story: home-files
    - run: git config pull.rebase false
    - story: changes-for-lesson-9
goals:
  - id: main-pulled
    label: "You've pulled the latest `main`"
    narration: The workflow starts on `main`. You're already there, so pull the latest work from GitHub.
    check:
      kind: all-of
      checks:
        - { kind: on-branch, name: main }
        - { kind: last-command, startsWith: git pull }
    hints:
      - The prompt shows `(main)`, so one command brings down the latest work.
      - Run `git pull`.
  - id: on-export-branch
    label: "You're on a new branch called `add-export`"
    narration: Make a branch called `add-export` for this change. The prepared, uncommitted changes come with you.
    check:
      kind: all-of
      checks:
        - { kind: branch-exists, name: add-export }
        - { kind: on-branch, name: add-export }
    hints:
      - "`git switch` with one flag creates a branch and moves you onto it."
      - Run `git switch -c add-export`.
  - id: export-committed
    label: "Export is committed on `add-export`"
    narration: Stage `export.py` and `app.py`. Check the file list with `git status` and the contents with `git diff --staged`, then make a `feat:` commit.
    check: { kind: commit-exists, containing: [ export.py ], modifies: [ app.py ], onBranch: add-export }
    hints:
      - Stage both files, then commit.
      - >-
        Run `git add export.py app.py`, then `git status` and `git diff --staged`, then `git commit -m "feat: add export"`.
  - id: branch-pushed
    label: "`add-export` is on GitHub, paired with `origin/add-export`"
    narration: Push `add-export` to `origin`. Use `-u` to remember the pairing for later pushes and pulls.
    check:
      kind: all-of
      checks:
        - { kind: pushed, branch: add-export }
        - { kind: upstream-set, branch: add-export }
    hints:
      - Use `-u` on this first push to remember which remote branch this branch uses.
      - Run `git push -u origin add-export`.
  - id: pull-request-open
    label: "Your pull request is open, and you've seen Sam's review"
    narration: Open a pull request with a title and a body. Then run `gh pr view` to see Sam's review.
    check:
      kind: any-of
      checks:
        - kind: all-of
          checks:
            - { kind: pr-open, branch: add-export }
            - { kind: last-command, startsWith: gh pr view }
        - { kind: pr-merged, branch: add-export }
    hints:
      - "`gh pr create` opens one, with `--title` and `--body` after it."
      - >-
        Run `gh pr create --title "feat: add export" --body "Adds a button that saves your tasks to a file."`, then `gh pr view`.
  - id: pull-request-merged
    label: "Export is merged, and your `main` has it"
    narration: Merge pull request 1 with a merge commit, and delete the branch.
    check:
      kind: all-of
      checks:
        - { kind: pr-merged, branch: add-export }
        - { kind: on-branch, name: main }
        - { kind: up-to-date-with-remote, branch: main }
        - { kind: commit-exists, messageIncludes: Merge pull request, onBranch: main }
        - { kind: branch-absent, name: add-export }
    hints:
      - "`gh pr merge` takes the pull request's number and a flag for the method."
      - "`--delete-branch` also switches you to `main` and pulls the merge down."
      - Run `gh pr merge 1 --merge --delete-branch`.
detours:
  - id: export-on-main
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, containing: [ export.py ], onBranch: main }
        - kind: not
          check: { kind: pr-merged, branch: add-export }
    message: Export was committed directly on `main`. This exercise uses a branch and pull request for review. Press Start over and create `add-export` before committing.
  - id: pushed-without-upstream
    check:
      kind: all-of
      checks:
        - { kind: pushed, branch: add-export }
        - kind: not
          check: { kind: upstream-set, branch: add-export }
    message: "`add-export` is on GitHub, but without `-u` it isn't paired with `origin/add-export`. Run `git push -u origin add-export` once to pair them."
  - id: merged-branch-left
    check:
      kind: all-of
      checks:
        - { kind: pr-merged, branch: add-export }
        - { kind: branch-exists, name: add-export }
    message: Your pull request is merged, but your laptop still has `add-export`. Run `git switch main` and `git pull`, then `git branch -d add-export`.
completionMessage: You opened a pull request, checked Sam's approval, and merged export into `main`.
```

## Recap {#recap}

You can now:

- Start new work from the latest `main`
- Push a branch and open a pull request
- See a teammate's review in the terminal
- Merge a pull request and tidy up

```bash
git pull                                 # bring down new commits
git push -u origin <branch>              # push a branch, pair it
gh pr create --title "..." --body "..."  # open a pull request
gh pr view                               # show the branch's pull request
gh pr merge <number> --merge --delete-branch   # merge and tidy up
```

Next up: what to do when Sam's changes and yours collide.
