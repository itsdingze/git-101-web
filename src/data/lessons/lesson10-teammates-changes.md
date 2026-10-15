---
id: 10
title: Bring in teammates' changes
description: Resolve merge conflicts and stash unfinished edits before pulling
unlocks: [stash]
---

## Two changes, one line {#same-line}

The next change adds reminders beside tasks. We've created `reminders.py` and updated `app.py` to describe that feature.

For this practice, we've already committed and pushed the changes on `add-reminders`:

```diff ~/projects/todo-app/reminders.py
+def load_reminders() -> None:
+    # Read the reminders for each task.
+    pass
```

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass

 def show_tasks() -> None:
-    # Show all tasks.
+    # Show all tasks with reminders.
     pass

 def show_due_dates() -> None:
     # Show each task's due date.
     pass
```

Meanwhile, Sam has merged a fix into `main`. It changes the same comment so the list shows only open tasks:

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass

 def show_tasks() -> None:
-    # Show all tasks.
+    # Show only open tasks.
     pass

 def show_due_dates() -> None:
     # Show each task's due date.
     pass
```

Before opening a pull request, you'll bring Sam's fix into the reminders branch and resolve the conflicting changes.

## Pull main into your branch {#pull-origin-main}

The reminders branch needs Sam's fix before it can be merged. Plain `git pull` uses its existing pairing with `origin/add-reminders`, so it won't bring in GitHub's `main`.

Stay on `add-reminders` and run `git pull origin main` to bring GitHub's `main` into the current branch. This updates `add-reminders`. It does not switch you to local `main` or move that branch:

```terminal
~/projects/todo-app (add-reminders) $ git pull origin main
From https://github.com/your-username/todo-app
 * branch            main       -> FETCH_HEAD
   78ace23..b91d190  main       -> origin/main
Auto-merging app.py
CONFLICT (content): Merge conflict in app.py
Automatic merge failed; fix conflicts and then commit the result.
~/projects/todo-app (add-reminders) $
```

Git stops because both branches changed the comment in `show_tasks` differently. Both commits remain recorded, but Git needs a final version of that line before it can finish the merge. Next, you'll inspect the two versions in the file.

## Read conflict markers {#conflict-markers}

Open `app.py` to see the conflict. Git has placed both versions between **conflict markers**, lines that separate the competing changes:

- `<<<<<<< HEAD` starts the version from `add-reminders`, the current branch.
- `=======` separates the two versions.
- `>>>>>>>` ends the incoming version from `main`. The hash after it identifies Sam's commit.

To resolve the conflict, choose the final text and remove all three marker lines. Here, the comment should keep both intentions: show only open tasks, and include their reminders.

```diff ~/projects/todo-app/app.py
 def load_tasks() -> None:
     # Read tasks from tasks.txt.
     pass
 
 def show_tasks() -> None:
 <<<<<<< HEAD
     # Show all tasks with reminders.
 =======
     # Show only open tasks.
 >>>>>>> b91d1904bee4416e838afa0bcc6d574e449c2d3c
     pass
 
 def show_due_dates() -> None:
     # Show each task's due date.
     pass
```

## Finish the merge {#finish-the-merge}

Remove every marker line before staging: Git can commit them as ordinary text. Stage the resolved file, check its status and staged diff, then finish the merge with `git commit --no-edit`. This keeps the merge message Git has already prepared:

```terminal
~/projects/todo-app (add-reminders) $ git add app.py
~/projects/todo-app (add-reminders) $ git status
On branch add-reminders
Your branch is up to date with 'origin/add-reminders'.

All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   app.py
~/projects/todo-app (add-reminders) $ git diff --staged
diff --git a/app.py b/app.py
index 6e4cec5..d3c9d05 100644
--- a/app.py
+++ b/app.py
@@ -3,7 +3,7 @@
     pass

 def show_tasks() -> None:
-    # Show all tasks with reminders.
+    # Show only open tasks with reminders.
     pass

 def show_due_dates() -> None:
~/projects/todo-app (add-reminders) $ git commit --no-edit
[add-reminders 38fc95a] Merge branch 'main' of https://github.com/your-username/todo-app into add-reminders
~/projects/todo-app (add-reminders) $ git push
Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Writing objects: 100% (5/5), done.
To https://github.com/your-username/todo-app.git
   a6c0a49..38fc95a  add-reminders -> add-reminders
~/projects/todo-app (add-reminders) $
```

The push sends the completed merge to `add-reminders` on GitHub.

The branch now contains both changes. The next step in the team workflow is to open a pull request, ask Sam to review it, and merge it into `main` after approval. The practice below stops after pushing the resolved branch.

```quiz
id: quiz-markers
question: "Your branch is `add-reminders`, and `app.py` shows `<<<<<<< HEAD` above a line. Whose version is that line?"
options:
  - text: The version from `add-reminders`
  - text: Sam's, from GitHub's `main`
    whyWrong: Sam's version comes after `=======`, above the `>>>>>>>` line.
  - text: The version from before either change
    whyWrong: The markers show only the two new versions, not the old line.
correctIndex: 0
explanation: "In this merge, `HEAD` marks your current commit. Its version appears above `=======`."
```

```sandbox-exercise
id: resolve-a-conflict
title: "Practice: resolve a conflict"
mode: guided
brief: "The practice starts on `add-reminders`, already committed and pushed. Sam's merged fix changes the same line of `app.py`. Pull `main` into the branch, keep both changes, and push the result."
seed:
  dir: projects/todo-app
  github: { signedIn: true }
  remote:
    name: origin
    url: https://github.com/your-username/todo-app.git
    setup:
      - story: team-after-work-with-a-team
    ahead:
      - story: sam-fixes-the-list
  setup:
    - story: home-files
    - run: git config pull.rebase false
    - story: reminders-branch
    - run: git push -u origin add-reminders
goals:
  - id: main-pulled-in
    label: "Git stopped on a conflict in `app.py`"
    narration: Bring GitHub's `main` into your branch.
    check:
      kind: any-of
      checks:
        - kind: all-of
          checks:
            - kind: merge-in-progress
            - { kind: on-branch, name: add-reminders }
        - { kind: commit-exists, messageIncludes: "fix: show only open tasks", onBranch: add-reminders }
    hints:
      - Plain `git pull` only brings in `origin/add-reminders`, so name the remote and the branch.
      - Run `git pull origin main`.
  - id: conflict-settled
    label: "`app.py` keeps both changes, with no markers"
    narration: Press Open `app.py` above the terminal. Turn the two versions into one line, `# Show only open tasks with reminders.`, delete the marker lines, and save.
    check: &settled-app-py
      kind: file-matches
      path: app.py
      lines:
        - "def load_tasks() -> None:"
        - "    # Read tasks from tasks.txt."
        - "    pass"
        - "def show_tasks() -> None:"
        - "    # Show only open tasks with reminders."
        - "    pass"
        - "def show_due_dates() -> None:"
        - "    # Show each task's due date."
        - "    pass"
        - "def show_search() -> None:"
        - "    # Show a search box."
        - "    pass"
        - "def sort_by_priority() -> None:"
        - "    # Sort tasks by priority."
        - "    pass"
        - "def sort_by_due_date() -> None:"
        - "    # Sort tasks by due date."
        - "    pass"
        - "def show_export() -> None:"
        - "    # Show a button to export tasks."
        - "    pass"
    hints:
      - Delete the `<<<<<<<`, `=======`, and `>>>>>>>` lines.
      - Replace the two versions of the comment with one line, `# Show only open tasks with reminders.`.
      - Keep the four spaces before the comment, so it stays inside the function.
  - id: merge-committed
    label: The merge is committed
    narration: Stage `app.py`, check `git status` and `git diff --staged`, then finish the merge using Git's prepared message. If you edit the file again, save and run `git add app.py` again before committing.
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, messageIncludes: "fix: show only open tasks", onBranch: add-reminders }
        - kind: not
          check: { kind: merge-in-progress }
        - kind: working-tree-clean
    hints:
      - Staging records the resolved file; `--no-edit` keeps Git's merge message.
      - Run `git add app.py`, then `git status` and `git diff --staged`, then `git commit --no-edit`.
  - id: merge-pushed
    label: "GitHub's `add-reminders` has the merge"
    narration: Push your branch, so GitHub has the merge too.
    check:
      kind: all-of
      checks:
        - { kind: pushed, branch: add-reminders }
        - { kind: commit-exists, messageIncludes: "fix: show only open tasks", onBranch: add-reminders }
    hints:
      - "`add-reminders` is already paired with GitHub, so plain push knows where to go."
      - Run `git push`.
detours:
  - id: markers-staged
    check: { kind: markers-staged }
    message: The staged copy still contains conflict markers. Open `app.py`, correct the marked section if needed, and save. Run `git add app.py` again to update the staged copy.
  - id: markers-committed
    check: { kind: markers-committed }
    message: The merge commit has marker lines in `app.py`. Press Start over, and delete the markers before you stage the file.
  - id: show-line-lost
    check:
      kind: all-of
      checks:
        - kind: merge-in-progress
        - kind: no-conflict-markers
        - kind: not
          check:
            kind: any-of
            checks:
              - { kind: file-has-line, path: app.py, line: "    # Show only open tasks with reminders." }
              - { kind: file-has-line, path: app.py, line: "    # Show all tasks with reminders." }
              - { kind: file-has-line, path: app.py, line: "    # Show only open tasks." }
    message: "The combined comment is missing. Open `app.py`, add `# Show only open tasks with reminders.` inside `show_tasks` with four spaces before it, and save. Run `git add app.py` again if you already staged the file."
  - id: resolution-off
    check:
      kind: all-of
      checks:
        - kind: merge-in-progress
        - kind: no-conflict-markers
        - kind: not
          check: *settled-app-py
    message: "The resolution needs one comment inside `show_tasks`: `# Show only open tasks with reminders.` Open `app.py`, correct that section, and keep the surrounding code. Save, then run `git add app.py` again."
  - id: resolution-committed-off
    check:
      kind: all-of
      checks:
        - kind: no-conflict-markers
        - { kind: commit-exists, messageIncludes: "fix: show only open tasks", onBranch: add-reminders }
        - kind: not
          check: { kind: merge-in-progress }
        - kind: not
          check: *settled-app-py
    message: "The merge was committed with a different version of `app.py`. Press Start over, then make `# Show only open tasks with reminders.` the only comment inside `show_tasks` before you commit."
completionMessage: You resolved the conflict, committed the merge, and pushed the branch with both changes.
```

## Pull with unfinished work {#pull-refused}

The next practice starts from a separate prepared state: the reminders pull request has been reviewed and merged, and you're back on `main`.

We've changed the app's name to Ticklist in `README.md`. This edit is still uncommitted:

```diff ~/projects/todo-app/README.md
-# To-do app
+# Ticklist
 A small to-do list app for learning Git.
```

Sam has also merged a README update explaining where tasks go. Before putting the name change on a new branch, try to bring in Sam's update:

```terminal
~/projects/todo-app (main) $ git pull
From https://github.com/your-username/todo-app
   c5bdc35..55a78f1  main       -> origin/main
Updating c5bdc35..55a78f1
error: Your local changes to the following files would be overwritten by merge:
	README.md
Please commit your changes or stash them before you merge.
Aborting
~/projects/todo-app (main) $
```

Git downloaded Sam's commit but stopped before merging it, because the merge would overwrite the uncommitted README edit. Local `main` and the name change are unchanged. Next, you'll set the edit aside temporarily so the pull can finish.

## Stash before pulling {#stash}

**Stashing** temporarily stores staged and unstaged changes to tracked files, then returns those files to the last commit. Plain `git stash` leaves new, untracked files in the working directory.

Here, the README is tracked. Use `git stash` to set its name change aside without committing it.

`git stash list` shows the stored changes. Once the working directory is clean, run `git pull` again:

```terminal
~/projects/todo-app (main) $ git stash
Saved working directory and index state WIP on main: c5bdc35 Merge pull request #3 from your-username/add-reminders
~/projects/todo-app (main) $ git stash list
stash@{0}: WIP on main: c5bdc35 Merge pull request #3 from your-username/add-reminders
~/projects/todo-app (main) $ git pull
Updating c5bdc35..55a78f1
Fast-forward
 README.md | 1 +
 1 file changed, 1 insertion(+)
~/projects/todo-app (main) $
```

`WIP` means work in progress. `stash@{0}` identifies the newest stash. The pull now succeeds, so local `main` has Sam's update and the name change is still stored in the stash.

## Bring the edit back {#restore-stashed-work}

Sam's update is now in `main`. Run `git stash pop` to reapply the name change on top of it, then check the working file's status and the stash list:

```terminal
~/projects/todo-app (main) $ git stash pop
Auto-merging README.md
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (ade6535ae15d344b0e480f84e6e9b9ffedd777b0)
~/projects/todo-app (main) $ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

no changes added to commit (use "git add" and/or "git commit -a")
~/projects/todo-app (main) $ git stash list  # no stash remains
~/projects/todo-app (main) $
```

Here, Git combines the edits and removes the stash. The empty `git stash list` confirms that no stash remains. The README now contains both changes:

```diff ~/projects/todo-app/README.md
 # Ticklist
 A small to-do list app for learning Git.
 Add your tasks to tasks.txt, one per line.
```

The name change is back in the working file, ready to stage and commit.

> [!WARNING] A conflicting pop keeps the stash
> If `git stash pop` reports a conflict, Git keeps the stash. Resolve the file's conflict markers before continuing.

```quiz
id: quiz-pull-refused
question: "`git pull` says your local changes to `README.md` would be overwritten. You want to keep both changes. What do you run first?"
options:
  - text: "`git stash`"
  - text: "`git restore README.md`"
    whyWrong: That discards the working edit. Stash it instead if you want to keep it.
  - text: "`git push`"
    whyWrong: The edit isn't committed, so there's nothing to push, and the pull still fails.
correctIndex: 0
explanation: Stashing sets the edit aside so the pull succeeds. `git stash pop` then reapplies it.
```

```sandbox-exercise
id: stash-and-pull
title: "Practice: stash, pull, and pop"
mode: guided
brief: "We've changed the app's name in `README.md`, but haven't committed it. You're on `main`, and Sam has merged a README update. Stash the name change, pull the update, then reapply the name change."
seed:
  dir: projects/todo-app
  github: { signedIn: true }
  remote:
    name: origin
    url: https://github.com/your-username/todo-app.git
    setup:
      - story: team-after-reminders-merged
    ahead:
      - story: sam-explains-the-tasks-file
  setup:
    - story: home-files
    - run: git config pull.rebase false
    - story: changes-for-lesson-10b
goals:
  - id: pull-tried
    label: You've seen why Git won't pull yet
    narration: Pull Sam's change, and read what Git says.
    check:
      kind: any-of
      checks:
        - { kind: last-command, startsWith: git pull, allowFailure: true }
        - kind: not
          check: { kind: stash-empty }
    hints:
      - You're on `main`, so plain `git pull` knows where to go.
      - Run `git pull`.
  - id: edit-shelved
    label: The README edit is stashed
    narration: Stash the README edit so Git can pull Sam's change.
    check:
      kind: any-of
      checks:
        - { kind: stash-count, count: 1 }
        - { kind: commit-exists, messageIncludes: "docs: explain where tasks go", onBranch: main }
    hints:
      - The command that stores uncommitted changes temporarily is `git stash`.
      - Run `git stash`.
  - id: sam-pulled
    label: "Your `main` has Sam's README change"
    narration: Your folder is clean now, so pull again.
    check:
      kind: all-of
      checks:
        - { kind: commit-exists, messageIncludes: "docs: explain where tasks go", onBranch: main }
        - { kind: up-to-date-with-remote, branch: main }
    hints:
      - Use the same command that refused before.
      - Run `git pull`.
  - id: edit-back
    label: The edit is back, on top of Sam's change
    narration: Reapply the edit with `git stash pop`, then check the result with `git status` and `git stash list`.
    check:
      kind: all-of
      checks:
        - kind: stash-empty
        - { kind: file-has-line, path: README.md, line: "# Ticklist" }
        - { kind: file-has-line, path: README.md, line: "Add your tasks to tasks.txt, one per line." }
    hints:
      - Use `git stash pop` to reapply the most recent stash.
      - Run `git stash pop`, then `git status` and `git stash list`.
detours:
  - id: edit-thrown-away
    check:
      kind: all-of
      checks:
        - kind: stash-empty
        - kind: not
          check: { kind: file-has-line, path: README.md, line: "# Ticklist" }
    message: The README edit is gone, and no stash holds it. Press Start over, and set the edit aside with `git stash` instead.
  - id: committed-on-main
    check:
      kind: all-of
      checks:
        - { kind: on-branch, name: main }
        - kind: not
          check: { kind: commit-count, count: 16 }
        - kind: not
          check: { kind: commit-count, count: 18 }
    message: The README edit is now committed on `main`. This exercise asks you to set it aside without committing, then bring it back after pulling. Press Start over and use `git stash`.
completionMessage: You stashed the name change, pulled Sam's update, and reapplied the name change. Both are now in the README.
```

## Share the app's new name {#share-new-name}

The README now has Sam's update and the uncommitted name change. Create a branch for the name change, then stage and review it before committing and opening a pull request:

```bash
git switch -c name-the-app
git add README.md
git status
git diff --staged
git commit -m "docs: name the app Ticklist"
git push -u origin name-the-app
gh pr create --title "docs: name the app Ticklist" --body "Renames the app in the README."
```

Run `gh pr view` to check Sam's review. After approval, merge the pull request and delete the finished branch, as in the export example.

## Recap {#recap}

You can now:

- Bring `main` into your branch
- Resolve a merge conflict and finish the merge
- Stash unfinished work, pull, and pop it back

```bash
git pull origin main    # bring main into this branch
git add <file>          # mark a conflict resolved
git commit --no-edit    # finish, with Git's message
git stash               # set unfinished changes aside
git stash pop           # take them back
git stash list          # list stored stashes
```

Next up: set up Git and GitHub CLI on your computer, then use the project files from the end of the course in your own repository.
