---
id: 9
title: Merging
description: Bring a finished branch back into main
unlocks: [ merge ]
---

## Meanwhile, on main {#main-moves-on}

Due dates work, and they're committed on `add-due-dates`. Before you bring them into `main`, one small job. Your README still doesn't say what the app does. That has nothing to do with due dates, so it goes on `main`:

```bash
~/todo-app (add-due-dates) $ git switch main
Switched to branch 'main'
~/todo-app (main) $ echo "Keeps your tasks in one list." >> README.md
~/todo-app (main) $ git add README.md
~/todo-app (main) $ git commit -m "docs: describe the app"   # docs: is the type for a change to docs
[main 94b88ea] docs: describe the app
 1 file changed, 1 insertion(+)
```

Now each branch has a commit the other doesn't. `main` has the README change, and `add-due-dates` has `dates.txt`.

## Merge a branch {#merge-basics visualization=git-graph variant=merging}

Combining one branch's work into another is called a **merge**.

You always merge from the branch that receives the work. You're already on `main`, so `git merge` only needs the name of the branch whose work you want:

```bash
~/todo-app (main) $ git merge add-due-dates
Merge made by the 'ort' strategy.       # 'ort' is just the name of Git's method
 dates.txt | 1 +                        # dates.txt arrived, with 1 line added
 1 file changed, 1 insertion(+)
 create mode 100644 dates.txt
```

Git combines changes to different files, or to different parts of one file, by itself. If both branches changed the same lines, it stops and asks you to choose. That's called a merge conflict, and the next lesson covers it.

> [!WARNING] Direction matters
> The branch you're on is the one that changes. Run `git merge main` while on `add-due-dates`, and you bring `main` into your branch instead. Check the prompt or `git status` before you merge.

```block-exercise
id: build-merge
prompt: "You're on `main`. Build the command that brings in the work from `add-due-dates`:"
availableBlocks: [ git, merge, switch, add-due-dates, main, branch ]
correctAnswer: [ git, merge, add-due-dates ]
decoyReasons:
  main: You're already on `main`, so name the branch whose work you want.
  switch: You're already on the receiving branch, so no move is needed.
  branch: "`git branch` lists your branches without bringing work in."
hints:
  - You only need three tiles.
  - Name the other branch, the one whose work you want.
  - The full command is `git merge add-due-dates`.
```

## See the lines join {#merge-graph}

Both branches had new commits, so Git joined them with a **merge commit**: a commit whose job is to tie two lines of history together.

Let's look at it. With `--graph`, `git log --oneline` draws each branch as a line beside its commits. Read it from the bottom up, oldest first:

```bash
~/todo-app (main) $ git log --oneline --graph
*   a9d2831 (HEAD -> main) Merge branch 'add-due-dates'  # the merge commit
|\                                      # the two lines join here
| * 3b35260 (add-due-dates) feat: add due dates  # the commit on your branch
* | 94b88ea docs: describe the app      # the commit main got meanwhile
|/                                      # the two lines split here
* c5ceec7 chore: stop tracking my notes # where both branches started
* 074f6c5 chore: ignore my tasks and experiments
* 5714454 feat: raise the task limit to 25
* 06dfe54 feat: raise the task limit
* 68cc05c feat: add task list           # your first commit
```

Each `*` is a commit. The names in brackets show where each branch points, and `HEAD -> main` means you're on `main`.

> [!WARNING] If a text editor opens
> On your own computer, `git merge` opens a text editor for the merge commit's message, already written. Saving and closing it finishes the merge. In Vim that's Esc, then `:wq`, then Enter.

## When main hasn't moved {#fast-forward}

What if you'd skipped the README change, so `main` had no commits of its own? Then there's nothing to join. Git moves `main` up to your newest commit, and that's called a **fast-forward**:

```bash
~/todo-app (main) $ git merge add-due-dates
Updating c5ceec7..3b35260               # main moves from its old commit to your newest
Fast-forward                            # no merge commit this time
 dates.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 dates.txt
~/todo-app (main) $ git log --oneline --graph -2
* 3b35260 (HEAD -> main, add-due-dates) feat: add due dates  # one straight line
* c5ceec7 chore: stop tracking my notes
```

> [!INFO] Two shapes, both normal
> Git picks the shape for you. Either way, `main` ends up holding the branch's work.

## Clean up after a merge {#after-merge}

`main` now holds everything from `add-due-dates`, so that branch's name has done its job. `git branch -d` deletes it, where `-d` means delete:

```bash
~/todo-app (main) $ git branch -d add-due-dates
Deleted branch add-due-dates (was 3b35260).  # only the name is gone
```

The commits stay in `main`'s history. Deleting a branch never deletes the work it brought in.

> [!WARNING] If `-d` refuses
> If Git says the branch `is not fully merged`, it holds commits no other branch has. Deleting it would lose that work, so merge it first or keep it.

```sandbox-exercise
id: merge-due-dates
title: "Practice: merge a finished branch"
mode: guided
brief: Due dates are finished and committed on `add-due-dates`, where you're standing. Give `main` a commit of its own, bring the due dates in, then tidy up.
seed:
  dir: todo-app
  setup:
    - story: after-branches
goals:
  - id: on-main
    label: You're on `main`, the branch that receives the work
    narration: A merge runs from the branch that receives the work, so move onto `main` first.
    check:
      kind: on-branch
      name: main
    hints:
      - The prompt shows you're on `add-due-dates`, so you need to move.
      - Run `git switch main`.
  - id: readme-committed
    label: "`main` has a commit of its own, describing the app"
    narration: >-
      The README doesn't say what the app does yet. Add a line with `echo "Keeps your tasks in one list." >> README.md`, then stage it and commit it with a `docs:` message.
    check:
      kind: commit-exists
      modifies: [ README.md ]
      onBranch: main
    hints:
      - Two arrows, `>>`, add the line and keep the title above it.
      - >-
        Run `echo "Keeps your tasks in one list." >> README.md`, then `git add README.md`.
      - >-
        Then run `git commit -m "docs: describe the app"`.
  - id: dates-merged
    label: "`dates.txt` is on `main`"
    narration: Now name the branch whose work you want. Then run `git log --oneline --graph` to see the two lines join.
    check:
      kind: commit-exists
      containing: [ dates.txt ]
      onBranch: main
    hints:
      - Name the branch you want to bring in, not the one you're on.
      - Run `git merge add-due-dates`.
  - id: branch-tidied
    label: "`add-due-dates` is gone from your branch list"
    narration: Everything from `add-due-dates` is on `main` now, so delete the branch name.
    check:
      kind: branch-absent
      name: add-due-dates
    hints:
      - It's `git branch` with the delete flag.
      - Run `git branch -d add-due-dates`.
detours:
  - id: merged-into-branch
    check:
      kind: all-of
      checks:
        - kind: merge-commit-exists
          onBranch: add-due-dates
        - kind: not
          check:
            kind: merge-commit-exists
            onBranch: main
    message: You merged while on `add-due-dates`, so `main` didn't change. Run `git switch main`, then `git merge add-due-dates`.
completionMessage: The due dates are on `main`, and your branch list is back to one. That's the whole life of a branch.
```

```quiz
id: quiz-wrong-direction
question: Due dates are done, and the prompt shows `(add-due-dates)`. You run `git merge main`. What happened?
options:
  - text: "`main` came into `add-due-dates`"
  - text: "`add-due-dates` went into `main`, as you wanted"
    whyWrong: The branch you're on receives the work, and here that's `add-due-dates`.
  - text: Nothing, Git blocks merges from the wrong branch
    whyWrong: Git can't know which way you meant, so it does what you typed.
  - text: "`add-due-dates` was deleted after the merge"
    whyWrong: Merging never deletes a branch.
correctIndex: 0
explanation: A merge brings the branch you name into the branch you're on.
```

## Recap {#recap}

You can now:

- Merge a branch from the branch that receives it
- Read your history as a graph
- Tell a merge commit from a fast-forward
- Delete a branch once it's merged

```bash
git switch main               # stand on the receiving branch
git merge add-due-dates       # bring that branch's work in
git log --oneline --graph     # see history as a graph
git branch -d add-due-dates   # delete the merged branch
```

Next up: the merges Git can't finish on its own.
