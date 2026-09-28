---
id: 10
title: Merge Conflicts
description: Settle the lines two branches both changed
unlocks: []
---

## Why conflicts happen {#why-conflicts}

Sometimes Git can't finish a merge by itself. If both branches changed the same lines of the same file, Git can't tell which version you want, so it stops and asks you. That's called a **merge conflict**.

Let's make one. Your task limit is 25, and you wonder how the app feels with room for 50. You try it on a branch:

```bash
~/todo-app (main) $ git switch -c raise-limit
Switched to a new branch 'raise-limit'
~/todo-app (raise-limit) $ echo "MAX_TASKS = 50" > settings.txt
~/todo-app (raise-limit) $ git add settings.txt
~/todo-app (raise-limit) $ git commit -m "feat: try a limit of 50"
[raise-limit 675cdaa] feat: try a limit of 50
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Before you've decided, you go back to `main` and give it a smaller bump, to 30. Now both branches have changed the same line:

```bash
~/todo-app (raise-limit) $ git switch main
Switched to branch 'main'
~/todo-app (main) $ echo "MAX_TASKS = 30" > settings.txt
~/todo-app (main) $ git add settings.txt
~/todo-app (main) $ git commit -m "feat: raise the task limit to 30"
[main 62e4bb8] feat: raise the task limit to 30
 1 file changed, 1 insertion(+), 1 deletion(-)
```

## Git stops and asks {#conflict-stops}

You've made up your mind: 50 it is. So you merge the branch:

```bash
~/todo-app (main) $ git merge raise-limit
Auto-merging settings.txt               # Git tries to combine the file
CONFLICT (content): Merge conflict in settings.txt  # both branches changed the same line
Automatic merge failed; fix conflicts and then commit the result.
```

> [!INFO] Nothing is broken
> Both branches still have every commit. Git merged what it could and paused on the line only you can decide.

## Read the markers {#conflict-markers visualization=conflict-markers}

Git writes both versions into the file, between three marker lines. Let's print it with `cat`:

```bash
~/todo-app (main) $ cat settings.txt
<<<<<<< HEAD                            # start of your version, from the branch you're on
MAX_TASKS = 30
=======                                 # the divider between the two versions
MAX_TASKS = 50
>>>>>>> raise-limit                     # end of the incoming version, from raise-limit
```

`HEAD` is Git's "you are here" marker, so in a merge the top half is yours. The bottom half comes from the branch you named in `git merge`.

> [!INFO] You decide what stays
> Keep the top, the bottom, both, or write something new. Then delete all three marker lines.

```conflict-exercise
id: resolve-conflict-both
prompt: "Say you added `sort(tasks)` on `main` and `filter(tasks)` on a branch called `add-filter`, in the same spot of `app.txt`. The app needs both, so keep both lines:"
fileName: app.txt
oursLabel: HEAD
theirsLabel: add-filter
oursContent: sort(tasks)
theirsContent: filter(tasks)
surroundingBefore: tasks = load()
surroundingAfter: show(tasks)
acceptableResolutions:
  - |-
    sort(tasks)
    filter(tasks)
  - |-
    filter(tasks)
    sort(tasks)
hints:
  - Nothing here competes, so both lines stay.
  - Delete the three marker lines and leave both lines, one after the other.
```

## Finish the merge {#resolution-workflow}

Lost track mid-merge? `git status` lists every file still in conflict:

```bash
~/todo-app (main) $ git status
On branch main
You have unmerged paths.                # a merge is still in progress
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:                         # these still have a conflict
  (use "git add <file>..." to mark resolution)
	both modified:   settings.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

You fix each file in the list, stage it to tell Git it's settled, then commit to finish the merge:

```bash
~/todo-app (main) $ echo "MAX_TASKS = 50" > settings.txt  # keep the version from raise-limit
~/todo-app (main) $ git add settings.txt  # mark the conflict as settled
~/todo-app (main) $ git commit -m "Merge raise-limit"  # the merge commit ends the merge
[main 95ea34d] Merge raise-limit
~/todo-app (main) $ git branch -d raise-limit  # merged, so the branch name can go
Deleted branch raise-limit (was 675cdaa).
```

On a real project, you'd open the file in your code editor instead, delete the three marker lines, and keep the lines you want. Here the file is one line, so `echo` is quicker.

> [!WARNING] Never leave a marker behind
> If you stage a file with `<<<<<<< HEAD` still in it, Git commits the marker as ordinary text. Check the file with `cat` before you stage it.

## Back out {#abort-merge}

Not sure yet which version is right? `git merge --abort` cancels the merge and puts every file back the way it was before you ran `git merge`:

```bash
~/todo-app (main) $ git merge --abort   # abort means cancel
~/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean   # back to before the merge
```

You can run the same `git merge` again whenever you're ready.

```sandbox-exercise
id: conflict-merge-walkthrough
title: "Practice: a conflict from start to finish"
mode: guided
brief: "You're on `main`, where `settings.txt` says `MAX_TASKS = 25`. You'll change that line on a branch and on `main`, then merge the two and settle the conflict."
seed:
  dir: todo-app
  setup:
    - story: after-merging
goals:
  - id: branch-changed
    label: "On `raise-limit`, the limit is 50 and committed"
    narration: >-
      Create a branch with `git switch -c raise-limit`. Set the limit with `echo "MAX_TASKS = 50" > settings.txt`, stage it, and commit it with `git commit -m "feat: try a limit of 50"`.
    check:
      kind: all-of
      checks:
        - kind: branch-exists
          name: raise-limit
        - kind: commit-exists
          messageIncludes: limit of 50
          onBranch: raise-limit
    hints:
      - Create the branch first, so the commit lands on it and not on `main`.
      - >-
        Run `git switch -c raise-limit`, then `echo "MAX_TASKS = 50" > settings.txt`.
      - >-
        Then run `git add settings.txt` and `git commit -m "feat: try a limit of 50"`.
  - id: main-changed
    label: "On `main`, the limit is 30 and committed"
    narration: >-
      Go back to `main` and change the same line a different way with `echo "MAX_TASKS = 30" > settings.txt`. Stage it and commit it with `git commit -m "feat: raise the task limit to 30"`.
    check:
      kind: commit-exists
      messageIncludes: limit to 30
      onBranch: main
    hints:
      - Switch to `main` before you change the file.
      - >-
        Run `git switch main`, then `echo "MAX_TASKS = 30" > settings.txt`.
      - >-
        Then run `git add settings.txt` and `git commit -m "feat: raise the task limit to 30"`.
  - id: merge-paused
    label: The merge has started and paused on `settings.txt`
    narration: You've decided on 50. Merge `raise-limit` into `main`, then run `cat settings.txt` to see the markers.
    check:
      kind: any-of
      checks:
        - kind: merge-in-progress
        - kind: commit-exists
          messageIncludes: limit of 50
          onBranch: main
    hints:
      - Name the branch whose work you want, not the one you're on.
      - Run `git merge raise-limit`, then `cat settings.txt`.
  - id: merge-finished
    label: "`settings.txt` holds one version, and a merge commit closes the merge"
    narration: >-
      Rewrite the file with the version you want, stage it, and commit to finish the merge.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          messageIncludes: limit to 30
          onBranch: main
        - kind: commit-exists
          messageIncludes: limit of 50
          onBranch: main
        - kind: working-tree-clean
        - kind: no-conflict-markers
        - kind: not
          check:
            kind: markers-committed
    hints:
      - Rewrite the whole file with `echo` and `>`, which wipes the markers too.
      - >-
        Run `echo "MAX_TASKS = 50" > settings.txt`, then `git add settings.txt`.
      - >-
        Then run `git commit -m "Merge raise-limit"`.
  - id: branch-tidied
    label: "`raise-limit` is gone from your branch list"
    narration: The branch is merged, so delete its name. Then run `git log --oneline --graph -4` to see the two lines join.
    check:
      kind: all-of
      checks:
        - kind: branch-absent
          name: raise-limit
        - kind: commit-exists
          messageIncludes: limit of 50
          onBranch: main
    hints:
      - It's `git branch` with the delete flag.
      - Run `git branch -d raise-limit`.
detours:
  - id: markers-committed
    check:
      kind: markers-committed
    message: >-
      The merge commit has conflict markers in `settings.txt`. Rewrite it with `echo "MAX_TASKS = 50" > settings.txt`, stage it, and commit again.
  - id: both-on-main
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          messageIncludes: limit of 50
          onBranch: main
        - kind: not
          check:
            kind: branch-exists
            name: raise-limit
        - kind: not
          check:
            kind: commit-exists
            messageIncludes: limit to 30
    message: >-
      The 50 commit landed on `main`, because the branch didn't exist yet. Press **Start over** and run `git switch -c raise-limit` first.
completionMessage: You made a conflict, chose a version, staged it, and committed the merge. Two changes to one line always end this way, and now you know the way out.
```

```quiz
id: quiz-abort-merge
question: Git reports a conflict, and you're not sure yet which version is right. How do you back out safely?
options:
  - text: "`git merge --abort`"
  - text: "`git add settings.txt`"
    whyWrong: That marks the conflict as settled, markers and all.
  - text: '`git commit -m "Merge"`'
    whyWrong: Git refuses to commit while conflicts remain.
  - text: "`git switch main`"
    whyWrong: You're already on `main`, and switching doesn't end a merge.
correctIndex: 0
explanation: Aborting puts everything back as it was, so you can merge again later.
```

## Recap {#recap}

You can now:

- Spot a conflict and know nothing is broken
- Read conflict markers and tell which side is which
- Finish a merge with `git add` and a commit
- Back out of a merge with `git merge --abort`

```bash
git merge <branch>    # may stop with a conflict
git status            # list files still in conflict
git add <file>        # mark a file as settled
git commit -m "..."   # finish the merge
git merge --abort     # cancel the merge, go back
```

Next up: setting unfinished work aside when something urgent comes up.
