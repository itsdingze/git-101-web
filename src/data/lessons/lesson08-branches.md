---
id: 8
title: Branches
description: Build a feature without risking the version that works
unlocks: [ branch, switch, checkout ]
---

## Why use a branch {#why-branches}

Your to-do app works. Your due-dates experiment worked too, so it's time to build due dates into the app for real. Halfway through, the app might not run at all.

A **branch** is a separate line of work inside the same project folder. You build the feature on its own branch, and the version that works stays untouched, one command away.

## How a branch moves {#what-are-branches visualization=git-graph variant=branching}

You've been on a branch all along. Every repository starts with one, here called `main`, and every commit you've made went onto it.

Think of a branch as a bookmark on its newest commit. Each time you commit, the bookmark moves forward to the new commit. Commit on a second branch, `add-due-dates`, and only that bookmark moves, while `main` stays where it was.

> [!INFO] Branches are free
> A branch is only a bookmark on one commit, so creating one copies nothing.

## Create and switch {#creating-branches}

The prompt shows the branch you're on. Let's make a branch for due dates and watch it change:

```bash
~/todo-app (main) $ git branch          # list your branches
* main                                  # * marks the branch you're on
~/todo-app (main) $ git switch -c add-due-dates
Switched to a new branch 'add-due-dates'  # -c means create, then switch moves you there
~/todo-app (add-due-dates) $ git branch # the prompt shows the new branch
* add-due-dates
  main                                  # main is still there, unchanged
```

Without `-c`, `git switch` moves you to a branch that already exists, as in `git switch main`.

Branch names can't have spaces, so use dashes, and name the branch after the work: `add-due-dates`, `fix-delete-button`.

If your own terminal doesn't show the branch in its prompt, `git branch` tells you which one you're on.

> [!INFO] Seen `git checkout -b`?
> Older tutorials write `git checkout -b add-due-dates`. It does the same thing and still works.

```block-exercise
id: build-switch-c
prompt: "Build the command that creates a branch called `fix-delete-button` and moves you onto it:"
availableBlocks: [ git, switch, -c, fix-delete-button, branch, main ]
correctAnswer: [ git, switch, -c, fix-delete-button ]
decoyReasons:
  branch: "`git branch` lists your branches, and moving onto one takes `git switch`."
  main: "`main` already exists, and this command names the new branch."
hints:
  - You want the one command that creates the branch and moves you onto it.
  - Start with `git switch`, then the flag that means create.
  - The full command is `git switch -c fix-delete-button`.
```

## Commit on the branch {#commit-on-branch}

On the new branch you work exactly as before. The feature goes in a new file, `dates.txt`, and its commit lands on `add-due-dates`:

```bash
~/todo-app (add-due-dates) $ echo "show_due(tasks)" > dates.txt
~/todo-app (add-due-dates) $ git add dates.txt
~/todo-app (add-due-dates) $ git commit -m "feat: add due dates"
[add-due-dates 3b35260] feat: add due dates   # the branch name, where main used to be
 1 file changed, 1 insertion(+)
 create mode 100644 dates.txt
~/todo-app (add-due-dates) $ git log --oneline -2
3b35260 (HEAD -> add-due-dates) feat: add due dates   # your branch moved forward
c5ceec7 (main) chore: stop tracking my notes          # main stayed where it was
```

## What switching changes {#switching-files}

Remember `HEAD`, Git's "you are here" marker? It points at the branch you're on. When you switch, `HEAD` moves to the other branch, and Git changes the files in your folder to match that branch's newest commit. Watch the folder as you switch:

```bash
~/todo-app (add-due-dates) $ ls
app.txt  dates.txt  notes  README.md  settings.txt  tasks.txt
~/todo-app (add-due-dates) $ git switch main
Switched to branch 'main'
~/todo-app (main) $ ls                   # main never had dates.txt, so it's gone
app.txt  notes  README.md  settings.txt  tasks.txt
~/todo-app (main) $ git switch add-due-dates
Switched to branch 'add-due-dates'
~/todo-app (add-due-dates) $ ls          # and it's back
app.txt  dates.txt  notes  README.md  settings.txt  tasks.txt
```

Nothing was deleted. `dates.txt` stayed safe in its commit the whole time. Your `notes` folder and `tasks.txt` never moved, because Git doesn't track them, so switching leaves them alone.

> [!INFO] Uncommitted edits come along
> Only committed work belongs to a branch. Edits you haven't committed stay in your folder when you switch.

```sandbox-exercise
id: branch-isolation-walkthrough
title: "Practice: watch a branch keep work separate"
mode: guided
brief: "`main` holds a working app. Your experiment in `try-dates.txt` worked, so you'll build due dates for real, on a branch of their own."
seed:
  dir: todo-app
  setup:
    - story: after-stop-tracking
goals:
  - id: on-new-branch
    label: You're on a new branch called `add-due-dates`
    narration: The experiment has done its job, so delete it with `rm try-dates.txt`. Git says nothing, because it never tracked that file. Then create a branch called `add-due-dates` and move onto it, in one command.
    check:
      kind: all-of
      checks:
        - kind: branch-exists
          name: add-due-dates
        - kind: on-branch
          name: add-due-dates
    hints:
      - "`git switch` moves you between branches, and one flag creates the branch first."
      - Run `git switch -c add-due-dates`.
  - id: dates-committed
    label: "`dates.txt` is committed on `add-due-dates`"
    narration: >-
      Write the feature with `echo "show_due(tasks)" > dates.txt`. Then stage it and commit it here, with a `feat:` message.
    check:
      kind: commit-exists
      containing: [ dates.txt ]
      onBranch: add-due-dates
    hints:
      - Write the file, stage it, then commit it.
      - >-
        Run `echo "show_due(tasks)" > dates.txt`, then `git add dates.txt`.
      - >-
        Then run `git commit -m "feat: add due dates"`.
  - id: back-on-main
    label: "Back on `main`, where `dates.txt` is nowhere to be seen"
    narration: Go back to `main`, then run `ls`.
    check:
      kind: all-of
      checks:
        - kind: on-branch
          name: main
        - kind: file-absent
          path: dates.txt
        - kind: commit-exists
          containing: [ dates.txt ]
          onBranch: add-due-dates
    hints:
      - "`git switch` without `-c` moves you to a branch that already exists."
      - Run `git switch main`, then `ls`.
  - id: dates-return
    label: "Back on `add-due-dates`, where `dates.txt` is waiting"
    narration: "`dates.txt` is gone, but it's safe in the commit on `add-due-dates`. Your folder now shows `main`, which never had it. Switch back and run `ls`."
    check:
      kind: all-of
      checks:
        - kind: on-branch
          name: add-due-dates
        - kind: file-present
          path: dates.txt
    hints:
      - Check the prompt, or run `git status`, to see which branch you're on now.
      - Run `git switch add-due-dates`, then `ls`.
detours:
  - id: dates-committed-on-main
    check:
      kind: commit-exists
      containing: [ dates.txt ]
      onBranch: main
    message: "`dates.txt` was committed on `main`, because you were still standing there. Press **Start over** and run `git switch -c add-due-dates` first."
completionMessage: One folder, two versions, and Git swaps between them as you switch. `main` still holds the app that works.
```

```quiz
id: quiz-switching-files
question: You committed `dates.txt` on `add-due-dates`, then ran `git switch main`. `dates.txt` is gone from your folder. Where is it?
options:
  - text: Safe in the commit on `add-due-dates`
  - text: Deleted, so you'll have to write it again
    whyWrong: Nothing was deleted, and switching back brings it right back.
  - text: Still in your folder, just hidden by Git
    whyWrong: Switching really changes your files to match the branch you're on.
  - text: Moved onto `main` along with the commit
    whyWrong: The commit lives on `add-due-dates`, and `main` never had it.
correctIndex: 0
explanation: Your folder always shows the branch you're on, and every commit stays safe on its branch.
```

## Recap {#recap}

You can now:

- Explain why you build a feature on a branch
- Tell which branch you're on
- Create a branch and move onto it
- Switch branches and watch your files change

```bash
git switch -c add-due-dates   # create a branch, move onto it
git switch main               # move to an existing branch
git branch                    # list branches, * marks yours
```

Next up: merging your due dates into `main`.
