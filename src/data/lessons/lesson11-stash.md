---
id: 11
title: Stash
description: Set unfinished work aside when something urgent comes up
unlocks: [ stash ]
---

## Set work aside {#when-to-stash}

Next on your ideas list is search. You've added a line to `app.txt` and started a new file, `search.txt`, when a friend who tried the app reports a bug: finished tasks still show a due date. The fix can't wait.

Your search work isn't ready to commit. But if you leave it in your folder, one `git add .` sweeps it into the fix.

**Stashing** puts your uncommitted changes on a shelf and leaves your working tree clean. Nothing is deleted, and you take the work back when you're done:

```bash
~/todo-app (main) $ git stash        # put your changes on the shelf
Saved working directory and index state WIP on main: 95ea34d Merge raise-limit   # index: Git's other name for the staging area
```

`WIP` in that message means "work in progress", and the rest names the commit you were on.

## New files stay behind {#tracked-vs-untracked}

Plain `git stash` only shelves changes to files Git already tracks. Your edit to `app.txt` is on the shelf, but `search.txt` is brand new and untracked, so it stayed in your folder:

```bash
~/todo-app (main) $ git status
On branch main
Untracked files:                        # app.txt is gone from the list, search.txt isn't
  (use "git add <file>..." to include in what will be committed)
	search.txt

nothing added to commit but untracked files present (use "git add" to track)
~/todo-app (main) $ git stash -u     # u for untracked: new files go on the shelf too
Saved working directory and index state WIP on main: 95ea34d Merge raise-limit
~/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean   # everything is on the shelf
```

Use `git stash -u` from the start and one stash takes both. `git status` shows whether anything stayed behind.

## Check the shelf {#stash-list}

The shelf can hold more than one stash. `git stash list` shows them all:

```bash
~/todo-app (main) $ git stash list   # what's on the shelf
stash@{0}: WIP on main: 95ea34d Merge raise-limit   # {0} is the newest: search.txt
stash@{1}: WIP on main: 95ea34d Merge raise-limit   # older ones count up: your app.txt edit
```

Now your folder is clean, so you can make the fix and commit it, and the commit holds only the fix:

```bash
~/todo-app (main) $ echo "show_due(unfinished(tasks))" > dates.txt
~/todo-app (main) $ git add dates.txt
~/todo-app (main) $ git commit -m "fix: hide due dates on finished tasks"
[main 37e1612] fix: hide due dates on finished tasks
 1 file changed, 1 insertion(+), 1 deletion(-)
```

> [!WARNING] Stashes are easy to forget
> Nothing on screen reminds you a stash exists. Run `git stash list` before you start new work, and pop what's waiting.

## Take it back {#stash-pop}

With the fix committed, `git stash pop` brings your work back. "Pop" means take the top item off the shelf, and the top is always your newest stash:

```bash
~/todo-app (main) $ git stash pop    # take the newest stash back
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	search.txt                           # the new file is back

nothing added to commit but untracked files present (use "git add" to track)
Dropped refs/stash@{0} (69d5bc4a63e5cdc08f9feb7813da1458bc8b0cb5)   # the shelf entry is used up
```

You made two stashes, so you pop once more, and your edit to `app.txt` comes back as well.

The work lands on whichever branch you're on, so switch back first if you moved.

```block-exercise
id: build-stash
prompt: "Build the command that shelves your changes, brand-new files included:"
availableBlocks: [ git, stash, -u, pop, list, add ]
correctAnswer: [ git, stash, -u ]
missingReasons:
  -u: Without `-u`, brand-new files stay in your folder.
decoyReasons:
  pop: "`pop` takes work off the shelf, and you want to put it on."
  list: "`list` shows the shelf without putting anything on it."
  add: "`git add` stages changes, and shelving is a different command."
hints:
  - Start with `git stash`.
  - Add the one-letter flag that stands for untracked.
  - The full command is `git stash -u`.
```

```sandbox-exercise
id: stash-round-trip
title: "Practice: shelve it, fix it, take it back"
mode: guided
brief: "Your app has due dates now, and search is next on your list. You'll start on search, get interrupted by a bug report, and come back to it."
seed:
  dir: todo-app
  setup:
    - story: after-merge-conflicts
goals:
  - id: search-started
    label: Search is started, in `app.txt` and a new `search.txt`
    narration: >-
      Start on search. Add a line to the app with `echo "search(tasks)" >> app.txt`, and start a new file with `echo "query = ask()" > search.txt`. Then run `git status`.
    check:
      kind: any-of
      checks:
        - kind: all-of
          checks:
            - kind: file-line-count
              path: app.txt
              atLeast: 3
            - kind: file-present
              path: search.txt
        - kind: not
          check:
            kind: stash-empty
    hints:
      - Two arrows for `app.txt`, so its two lines stay. One arrow for the new file.
      - >-
        Run `echo "search(tasks)" >> app.txt`, then `echo "query = ask()" > search.txt`.
  - id: shelved
    label: Your changes are on the shelf
    narration: A bug report lands, and finished tasks still show a due date. Shelve your work with plain `git stash`, and run `git status`.
    check:
      kind: not
      check:
        kind: stash-empty
    hints:
      - No flags and no file names this time.
      - Run `git stash`.
  - id: untracked-shelved
    label: "`search.txt` is on the shelf too, and the folder is clean"
    narration: "`search.txt` stayed behind, because Git never tracked it. Stash again with the flag for untracked files. That adds a second entry to the shelf, and you'll take both back later."
    check:
      kind: all-of
      checks:
        - kind: not
          check:
            kind: stash-empty
        - kind: file-absent
          path: search.txt
        - kind: working-tree-clean
    hints:
      - The flag is one letter, and it stands for untracked.
      - Run `git stash -u`, then `ls`.
  - id: fix-committed
    label: The due-dates fix is committed
    narration: >-
      Fix the bug with `echo "show_due(unfinished(tasks))" > dates.txt`, then commit that file with a `fix:` message.
    check:
      kind: commit-exists
      modifies: [ dates.txt ]
    hints:
      - Stage the fixed file, then commit it.
      - >-
        Run `git add dates.txt`, then `git commit -m "fix: hide due dates on finished tasks"`.
  - id: restored
    label: The shelf is empty, and your search work is back
    narration: Run `git stash pop` until `git stash list` is empty. Then `git status` shows your search work back where it was.
    check:
      kind: all-of
      checks:
        - kind: stash-empty
        - kind: file-present
          path: search.txt
        - kind: commit-exists
          modifies: [ dates.txt ]
    hints:
      - Each `git stash pop` brings back one entry, newest first.
      - Run `git stash pop`, then `git stash list` to see if anything's left.
detours:
  - id: fix-swept-search
    check:
      kind: any-of
      checks:
        - kind: commit-exists
          modifies: [ dates.txt, app.txt ]
        - kind: commit-exists
          containing: [ search.txt ]
    message: Your fix commit swept up the search work too, which stashing first prevents. Press **Start over**, stash, then fix.
completionMessage: The fix is in, and your search work is back as you left it. Stash whenever something urgent interrupts unfinished work.
```

```quiz
id: quiz-urgent-fix
question: You're midway through a feature, with uncommitted edits, and an urgent fix can't wait. What do you run first?
options:
  - text: "`git stash`"
  - text: "`git add .`"
    whyWrong: Staging sets nothing aside, so your edits would go into the fix.
  - text: "`git stash pop`"
    whyWrong: That takes work off the shelf, and you want to put it on.
  - text: "`git switch main`"
    whyWrong: Uncommitted edits come with you when you switch, so they're still in the way.
correctIndex: 0
explanation: Stashing clears your folder, so the fix commit holds only the fix.
```

## Recap {#recap}

You can now:

- Shelve unfinished work and take it back
- Include brand-new files with `-u`
- Check the shelf with `git stash list`

```bash
git stash         # shelve tracked changes
git stash -u      # shelve new files too
git stash list    # show the shelf
git stash pop     # take the newest back
```

Next up: undoing a change to a file, or fixing the commit you just made.
