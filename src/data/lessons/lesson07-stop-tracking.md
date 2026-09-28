---
id: 7
title: Stop Tracking a File
description: Untrack a file you committed by mistake, and keep your copy
unlocks: [ rm ]
---

## When a rule comes too late {#already-tracked}

Your `.gitignore` has a rule for `notes/`, but your notes went into your first commit, before any rule existed. Watch what happens when you add an idea:

```bash
~/todo-app (main) $ cat .gitignore
tasks.txt
try-*
notes/                                   # the rule is there
~/todo-app (main) $ echo "Add tags" >> notes/ideas.txt
~/todo-app (main) $ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   notes/ideas.txt              # and Git still lists the file

no changes added to commit (use "git add" and/or "git commit -a")
```

`.gitignore` only covers untracked files. `notes/ideas.txt` is already tracked, so the rule does nothing for it until Git stops tracking the file.

## Untrack a file {#untrack-a-file}

`git rm --cached` makes Git stop tracking a file, and a commit records that:

```bash
~/todo-app (main) $ git rm --cached notes/ideas.txt   # stop tracking it, keep your copy
rm 'notes/ideas.txt'                                  # Git confirms, and your file stays
~/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	deleted:    notes/ideas.txt                           # deleted from Git's next commit, not your folder
~/todo-app (main) $ git commit -m "chore: stop tracking my notes"
[main c5ceec7] chore: stop tracking my notes
 1 file changed, 2 deletions(-)
 delete mode 100644 notes/ideas.txt                   # new commits no longer include it
~/todo-app (main) $ cat notes/ideas.txt               # still in your folder, new idea and all
Add due dates
Add search
Add tags
```

`rm` is short for remove. The staging area used to be called the cache, which is where `--cached` comes from, so the command removes the file from the staging area only. Your next commit leaves it out, and your folder keeps it.

`git status` calls that `deleted`, which looks alarming. It only means the next commit won't hold the file.

Now that the file is untracked, your `notes/` rule covers it, and Git stops listing it. Your older commits still hold the notes as they were.

A whole folder takes `-r` as well (recursive, meaning everything inside it too), as in `git rm -r --cached notes/`.

> [!WARNING] Keep the --cached flag
> Without it, `git rm notes/ideas.txt` untracks the file and deletes it from your folder too.

```block-exercise
id: build-rm-cached
prompt: "`notes/ideas.txt` is already tracked. Build the command that stops tracking it but keeps it in your folder:"
availableBlocks: [ git, rm, add, --cached, notes/ideas.txt, -r ]
correctAnswer: [ git, rm, --cached, notes/ideas.txt ]
missingReasons:
  --cached: Without `--cached`, `git rm` deletes the file from your folder too.
decoyReasons:
  add: "`git add` starts tracking a file, and here you want Git to stop."
  -r: "`-r` is for a whole folder, and this names one file."
hints:
  - The command that removes a file from Git is `git rm`.
  - Add the flag that leaves your folder alone, then the file's path.
  - The full command is `git rm --cached notes/ideas.txt`.
```

```sandbox-exercise
id: stop-tracking-notes
title: "Practice: untrack your notes"
mode: guided
brief: "`.gitignore` has a rule for `notes/`, but `notes/ideas.txt` went into your first commit, so Git still tracks it."
seed:
  dir: todo-app
  setup:
    - story: after-ignore-files
goals:
  - id: notes-untracked
    label: "`notes/ideas.txt` is untracked, and still in your folder"
    narration: >-
      Add an idea with `echo "Add tags" >> notes/ideas.txt`, and run `git status` to see Git list the file, rule or no rule. Then untrack it without deleting your copy.
    check:
      kind: all-of
      checks:
        - kind: file-untracked
          path: notes/ideas.txt
        - kind: file-present
          path: notes/ideas.txt
    hints:
      - The command is `git rm`, plus the flag that leaves your folder alone.
      - Run `git rm --cached notes/ideas.txt`.
  - id: untracking-committed
    label: The untracking is committed
    narration: Untracking is a change, so commit it with a `chore:` message. Then run `cat notes/ideas.txt` to see your notes still in your folder.
    check:
      kind: all-of
      checks:
        - kind: file-present
          path: notes/ideas.txt
        - kind: file-untracked
          path: notes/ideas.txt
        - kind: working-tree-clean
    hints:
      - Run `git status` to see the removal waiting to be committed.
      - >-
        Run `git commit -m "chore: stop tracking my notes"`.
detours:
  - id: notes-deleted
    check:
      kind: file-absent
      path: notes/ideas.txt
    message: Plain `git rm` deleted your notes from your folder too. Press **Start over** and run `git rm --cached notes/ideas.txt` this time.
completionMessage: Your notes stay in your folder, and Git won't list them again. Untrack a file this way whenever its rule comes too late.
```

```quiz
id: quiz-already-tracked
question: You committed your notes weeks ago. Today you add `notes/` to `.gitignore`. What's true now?
options:
  - text: They're still tracked, until you untrack them
  - text: Git untracks them automatically from now on
    whyWrong: A rule only covers files Git isn't tracking yet.
  - text: Git deletes them from your folder
    whyWrong: A `.gitignore` never touches the files in your folder.
  - text: Your old commits no longer hold them
    whyWrong: Old commits keep every file exactly as it was committed.
correctIndex: 0
explanation: A tracked file stays tracked, whatever `.gitignore` says. Untrack it with `git rm --cached` and commit.
```

## Recap {#recap}

You can now:

- Spot when `.gitignore` can't help
- Untrack a committed file without deleting it
- Untrack a whole folder with `-r`

```bash
git rm --cached <file>        # untrack, keep it in your folder
git rm -r --cached <folder>   # same, for a whole folder
```

Next up: branches, so you can build a feature without breaking what works.
