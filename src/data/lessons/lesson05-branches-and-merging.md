---
id: 5
title: Branches and merging
description: Create a branch for an idea, then merge it into the main branch
unlocks: [switch, branch, merge, log]
---

## Keep work on separate branches {#why-branches}

We've prepared an experimental search feature. You'll commit it on a separate branch so `main` stays unchanged while you decide whether to keep it.

A **branch** names a line of work in your project. You've been using `main`. A new branch starts at your current commit, shares the history leading to it, and can then gain its own commits.

From that shared starting point, the two branches can develop separately. Commits made on the search branch extend its line of work, while `main` keeps its own history. Later, you can merge the search work into `main` if you decide to keep it.

## Search and a bug fix {#search-changes}

For the search feature experiment, we've created `search.py` and added a function outline in `app.py` for a search box. None of these changes is committed yet:

```diff ~/projects/todo-app/search.py
+def find_tasks() -> None:
+    # Find tasks matching the search.
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
+
+def show_search() -> None:
+    # Show a search box.
+    pass
```

While preparing search, we noticed that finished tasks still showed due dates. We've also prepared a fix in `dates.py`, represented here by a new comment:

```diff ~/projects/todo-app/dates.py
 def read_due_dates() -> None:
     # Read each task's due date.
+    # Skip finished tasks.
     pass
```

## Make a branch {#make-a-branch}

To commit search on its own branch, first create that branch with `git switch -c`. The `-c` stands for create, and the command also moves you onto the new branch.

The branch starts from the current commit, and the prepared changes stay in the folder. Stage only `search.py` and `app.py`, check the staged list, then commit the feature:

```terminal
~/projects/todo-app (main) $ git switch -c add-search
Switched to a new branch 'add-search'
~/projects/todo-app (add-search) $ git add search.py app.py
~/projects/todo-app (add-search) $ git status
On branch add-search
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.py
	new file:   search.py

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   dates.py
~/projects/todo-app (add-search) $ git commit -m "feat: add search"
[add-search 533373d] feat: add search  # on the new branch
 2 files changed, 7 insertions(+)
 create mode 100644 search.py
~/projects/todo-app (add-search) $
```

The prompt now shows `(add-search)`. Branch names can't have spaces, so use hyphens, and name each branch after its work.

`dates.py` stayed out of the commit, because the fix belongs on `main`. Step through the diagram to see the search commit extend the new branch while `main` stays at the shared starting point. In the diagram, **`HEAD`** is Git's "you are here" marker, and it points at the branch you're on.

```visualization git-graph
setup:
  - 'git commit -m "chore: stop tracking debug.log"'
  - 'git commit -m "feat: add due dates"'
  - 'git commit -m "docs: add a README"'
commands:
  - git switch -c add-search
  - 'git commit -m "feat: add search"'
```

## Commit the fix on `main` {#fix-on-main}

Search is now committed on `add-search`. Next, put the due-date fix on `main` so it can be used before the search experiment is merged.

`git switch` without `-c` moves you to an existing branch. It updates files in the same project folder to match that branch.

Here, `search.py` disappears and `app.py` returns to its version on `main`. The uncommitted `dates.py` fix comes along because switching doesn't overwrite it. Stage `dates.py`, check the staged list, then commit the fix:

```terminal
~/projects/todo-app (add-search) $ git switch main
M	dates.py  # M: modified, still not committed
Switched to branch 'main'
~/projects/todo-app (main) $ git add dates.py
~/projects/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   dates.py
~/projects/todo-app (main) $ git commit -m "fix: hide due dates on finished tasks"
[main f2b35de] fix: hide due dates on finished tasks
 1 file changed, 1 insertion(+)
~/projects/todo-app (main) $
```

The fix is now committed on `main`. Search remains on `add-search` until you merge it.

> [!INFO] Uncommitted changes usually come along
> Uncommitted changes can come with you when you switch branches. Git refuses if switching would overwrite them. Here, both branches have the same committed `dates.py`, so the prepared fix comes with you.

## Merge a branch {#merge}

You decide to keep the search changes. Bringing one branch's work into another is called a **merge**.

A merge changes the branch you're on. You're on `main`, so name the branch whose work you want:

```terminal
~/projects/todo-app (main) $ git merge add-search
Merge made by the 'ort' strategy.  # 'ort' names Git's method
 app.py    | 4 ++++
 search.py | 3 +++
 2 files changed, 7 insertions(+)
 create mode 100644 search.py
~/projects/todo-app (main) $
```

Both branches have a commit the other doesn't, so Git ties them together with a **merge commit**. Git writes its message for you: `Merge branch 'add-search'`.

Git usually combines changes to different files or different parts of a file. If it can't combine them safely, it stops with a **merge conflict**. Conflicting edits to the same line are one example.

If `main` hadn't moved since you made the branch, there'd be nothing to tie together. Git would **fast-forward** instead, which means it moves `main` up to the branch's newest commit without a merge commit.

> [!WARNING] Check the prompt before you merge
> The branch you're on is the one that changes. If you run `git merge main` on `add-search`, `main` comes into your branch instead.

Step through the diagram to see the search and bug-fix commits join in the merge commit on `main`.

```visualization git-graph
setup:
  - 'git commit -m "chore: stop tracking debug.log"'
  - 'git commit -m "feat: add due dates"'
  - 'git commit -m "docs: add a README"'
  - git switch -c add-search
  - 'git commit -m "feat: add search"'
commands:
  - git switch main
  - 'git commit -m "fix: hide due dates on finished tasks"'
  - git merge add-search
```

```block-exercise
id: build-merge
prompt: "On `main`, build the command that brings in the work from `add-search`:"
availableBlocks: [ git, merge, switch, add-search, main ]
correctAnswer: [ git, merge, add-search ]
decoyReasons:
  main: You're already on `main`, so name the branch whose work you want.
  switch: You're already on the branch that receives the work.
hints:
  - Start with `git`, then the command that brings in another branch's work.
  - Name the other branch, the one whose work you want.
  - The full command is `git merge add-search`.
```

## Delete the merged branch {#tidy-up}

Search is merged, so the separate `add-search` branch has finished its job. Deleting it keeps the branch list clear for future work.

Run `git branch -d` to delete it, then `git branch` to check the remaining branches. The `-d` stands for delete.

```terminal
~/projects/todo-app (main) $ git branch -d add-search
Deleted branch add-search (was 533373d).
~/projects/todo-app (main) $ git branch
* main
~/projects/todo-app (main) $
```

`add-search` no longer appears in the branch list, so you can't switch to it by that name. Its merged commits remain in `main`'s history.

## Read the branch history {#branch-history}

After merging, you can check that both lines of work remain in the history. By default, `git log` lists the history leading to your current commit, newest first. Here is the newest entry from this example:

```terminal
~/projects/todo-app (main) $ git log
commit 672451221b8010324c5d8fb016c43e962d9b5896 (HEAD -> main)
Merge: f2b35de 533373d
Author: Ada Lovelace <ada@example.com>
Date:   Tue Nov 14 22:20:20 2023 +0000

    Merge branch 'add-search'
```

Each entry shows the commit's hash, author, date, and message. `Merge:` lists the two commits that the merge joined.

The next screen shows how these commits connect.

## Read the branch graph {#branch-graph}

The full log lists commits one after another. Add `--oneline` for a short hash and message on each line, then `--graph` to draw how the commits connect:

```terminal
~/projects/todo-app (main) $ git log --oneline --graph  # graph
*   6724512 (HEAD -> main) Merge branch 'add-search'
|\
| * 533373d feat: add search  # search
* | f2b35de fix: hide due dates on finished tasks
|/
* 4f0f26c docs: add a README
* 03657a4 feat: add due dates
* 7eb0ee6 chore: stop tracking debug.log
* 8c7821f feat: add task list
~/projects/todo-app (main) $
```

The graph still shows both lines of work after the branch name is deleted. `(HEAD -> main)` marks the current branch.

```quiz
id: quiz-switch-uncommitted
question: "`dates.py` has an uncommitted edit. Git lets you switch to `main`. Where is the edit?"
options:
  - text: In `dates.py`, still uncommitted
  - text: Safe in a commit on `add-search`
    whyWrong: Only commits belong to a branch, and this change was never committed.
  - text: Gone, because switching replaces your files
    whyWrong: This switch kept your edit. Git would refuse if switching would overwrite it.
correctIndex: 0
explanation: The switch succeeded without overwriting your edit, which remains uncommitted.
```

```quiz
id: quiz-merge-direction
question: The prompt shows `(add-search)`, and you run `git merge main`. What happens?
options:
  - text: "`main` comes into `add-search`"
  - text: "`add-search` goes into `main`"
    whyWrong: The branch you're on receives the work, and here that's `add-search`.
  - text: Nothing, because Git blocks merges in the wrong direction
    whyWrong: Git can't know which way you meant, so it does what you typed.
correctIndex: 0
explanation: A merge brings the branch you name into the branch you're on.
```

```sandbox-exercise
id: branch-and-merge
title: "Practice: branch and merge"
mode: guided
brief: "Your turn: search and the due-dates fix are both uncommitted on `main`. Put search on its own branch, commit the fix on `main`, then merge search in and tidy up."
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-one-change-per-commit
    - story: changes-for-lesson-5
goals:
  - id: on-search-branch
    label: "You're on a new branch called `add-search`"
    narration: Search is an experiment, so make a branch called `add-search` and move onto it.
    check:
      kind: all-of
      checks:
        - { kind: branch-exists, name: add-search }
        - { kind: on-branch, name: add-search }
    hints:
      - "`git switch` moves you between branches, and one flag creates the branch first."
      - Run `git switch -c add-search`.
  - id: search-committed
    label: "Search is committed on `add-search`, without the fix"
    narration: Stage only `search.py` and `app.py`, check the staged list with `git status`, and make a `feat:` commit.
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, containing: [ search.py ], modifies: [ app.py ], onBranch: add-search }
        - kind: not
          check: { kind: commit-exists, containing: [ search.py ], modifies: [ dates.py ] }
        - kind: not
          check: { kind: commit-exists, containing: [ search.py ], onBranch: main }
    hints:
      - Leave `dates.py` out, because the fix belongs on `main`.
      - >-
        Run `git add search.py app.py`, then `git status`, then `git commit -m "feat: add search"`.
  - id: fix-on-main
    label: "The fix is committed on `main`"
    narration: Switch back to `main`. The uncommitted fix comes with you. Stage `dates.py`, check the staged list, then make a `fix:` commit.
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, modifies: [ dates.py ], onBranch: main }
        - kind: not
          check: { kind: commit-exists, modifies: [ dates.py ], onBranch: add-search }
    hints:
      - "`git switch` without `-c` moves you to a branch that already exists."
      - Run `git switch main`, then `git add dates.py` and `git status`.
      - >-
        Then run `git commit -m "fix: hide due dates on finished tasks"`.
  - id: search-merged
    label: "Search is merged into `main`"
    narration: You decide to keep the search changes. Stay on `main`, and merge in the branch whose work you want.
    check:
      kind: all-of
      checks:
        - { kind: on-branch, name: main }
        - { kind: merge-commit-exists, onBranch: main }
        - { kind: commit-exists, messageIncludes: "Merge branch 'add-search'" }
    hints:
      - Name the branch you want to bring in, not the one you're on.
      - Run `git merge add-search`.
  - id: branch-deleted
    label: "`add-search` is gone from your branches"
    narration: "Search is merged, so delete `add-search` to tidy the branch list. Then run `git branch` to check that only `main` remains."
    check:
      kind: all-of
      checks:
        - { kind: branch-absent, name: add-search }
        - { kind: last-command, startsWith: git branch }
    hints:
      - Use `git branch` with the flag that means delete.
      - Run `git branch -d add-search`, then `git branch`.
  - id: graph-seen
    label: You've seen the two lines of work join
    narration: Run `git log --oneline --graph` to see the search line join `main`.
    check:
      kind: any-of
      checks:
        - { kind: last-command, startsWith: git log --oneline --graph }
        - { kind: last-command, startsWith: git log --graph --oneline }
    hints:
      - "`git log` lists your commits, and two flags draw them as a graph."
      - Run `git log --oneline --graph`.
detours:
  - id: merged-into-branch
    check: { kind: commit-exists, messageIncludes: into add-search }
    message: You merged while on `add-search`, so `main` came into that branch instead. Press Start over, and merge from `main` this time.
  - id: search-on-main
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, containing: [ search.py ], onBranch: main }
        - kind: not
          check: { kind: merge-commit-exists, onBranch: main }
    message: "Search reached `main` without a merge. Press Start over: commit search on `add-search` and the fix on `main` before you merge."
  - id: fix-on-search-branch
    check: { kind: commit-exists, modifies: [ dates.py ], onBranch: add-search }
    message: The due-dates fix was committed on `add-search`, but it belongs on `main`. Press Start over, and leave `dates.py` out of the search commit.
completionMessage: Search is on `main`, merged from its own branch, and the fix went straight to `main`. `main` is your only branch again.
```

## Recap {#recap}

You can now:

- Put an experiment on its own branch
- Switch between branches
- Merge a branch into the one you're on
- Delete a branch once it's merged

```bash
git switch -c <branch>      # create a branch, move onto it
git switch main             # move to an existing branch
git merge <branch>          # bring that branch's work in
git branch -d <branch>      # delete a merged branch
git log --oneline           # one line per commit
git log --oneline --graph   # draw your history
```

Next up: discarding an unwanted edit and correcting your latest unshared commit.
