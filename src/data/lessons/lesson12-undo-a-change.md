---
id: 12
title: Undo a Change
description: Unstage a file, throw away edits, and fix your last commit
unlocks: [ restore ]
---

## Unstage a file {#restore-unstage visualization=restore-walkthrough}

Search is finished. To test it on a huge list, you'd set the task limit to 9999, and then `git add .` staged that test value along with your search work:

```bash
~/todo-app (main) $ echo "MAX_TASKS = 9999" > settings.txt   # only for testing
~/todo-app (main) $ git add .
~/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.txt
	new file:   search.txt
	modified:   settings.txt                 # this one shouldn't go in
```

**Unstaging** takes a file out of the staging area, and your edits stay in the file. Git has been printing the command for it in its `git status` hints:

```bash
~/todo-app (main) $ git restore --staged settings.txt   # out of the staging area, edits kept
~/todo-app (main) $ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   app.txt
	new file:   search.txt

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   settings.txt                 # still edited, just not staged
```

Nothing is lost. `settings.txt` is back in the `Changes not staged for commit` group, and your search work is still staged.

## Throw away edits {#restore-discard}

You don't want the test limit at all. Without `--staged`, `git restore` throws your unstaged edits away. Git's hint calls this "discard". The file goes back to how it was at your last commit, or at your last `git add` if you staged it since:

```bash
~/todo-app (main) $ git restore settings.txt   # throw the edit away
~/todo-app (main) $ cat settings.txt
MAX_TASKS = 50                                 # back to the committed limit
```

Throwing away an edit you already staged takes both commands, the `--staged` one first.

> [!DANGER] Plain restore deletes edits forever
> Edits you never committed aren't recorded anywhere, so no command can bring them back.

```block-exercise
id: build-restore-staged
prompt: "Build the command that takes `settings.txt` out of the staging area but keeps your edits:"
availableBlocks: [ git, restore, --staged, settings.txt, add, . ]
correctAnswer: [ git, restore, --staged, settings.txt ]
missingReasons:
  --staged: Without `--staged`, `git restore` throws your edits away and leaves the staging area alone.
decoyReasons:
  add: "`git add` stages a file, and here you want to unstage one."
  .: The dot covers every file, and only `settings.txt` should be unstaged.
hints:
  - One flag is the difference between unstaging and throwing edits away.
  - Use `git restore` with `--staged`, then the file name.
  - The full command is `git restore --staged settings.txt`.
```

## Fix the last message {#amend-commit}

With the test limit gone, you commit search in a hurry, and the message has a typo. **Amending** replaces your last commit with a corrected one, instead of adding another commit on top:

```bash
~/todo-app (main) $ git commit -m "feat: add serch"   # the typo
[main 6b20fb2] feat: add serch
 2 files changed, 2 insertions(+)
 create mode 100644 search.txt
~/todo-app (main) $ git commit --amend -m "feat: add search"
[main 4b5a07b] feat: add search
 Date: Tue Nov 14 22:27:20 2023 +0000
 2 files changed, 2 insertions(+)
 create mode 100644 search.txt
~/todo-app (main) $ git log --oneline -2
4b5a07b (HEAD -> main) feat: add search      # fixed, with a new hash
37e1612 fix: hide due dates on finished tasks
```

There's still one search commit, because the corrected one took the old one's place. The new hash shows it's a new commit, and the line starting ` Date:` only repeats when the original was made.

## Add a forgotten file {#amend-add-file}

Amending also fixes a commit that's missing a file. Search should have come with a line of help text. You write it, stage it, and amend, since amend picks up whatever is staged:

```bash
echo "Type a word to find matching tasks." > search-help.txt   # the file that was missing
git add search-help.txt          # stage it
git commit --amend --no-edit     # put it in the last commit, message unchanged
```

`--no-edit` keeps the message as it is, so you don't type it again.

> [!WARNING] Amend before you share
> Later you'll send commits to GitHub, where other people get them. Amend a commit only before you send it. Afterwards, their copy still has the old commit, and the two histories stop matching.

## Back to your last commit {#restore-everything}

One more way to use `git restore`. Say you let an AI tool loose on the app, and you don't like what it did. If you committed before you let it start, one command throws away every unstaged edit in the folder:

```bash
~/todo-app (main) $ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   app.txt                      # the tool rewrote two of your files
	modified:   settings.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	junk.txt                             # and made a new one

no changes added to commit (use "git add" and/or "git commit -a")
~/todo-app (main) $ git restore .        # the dot means everything in this folder
~/todo-app (main) $ git status
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	junk.txt                             # the new file is still here

nothing added to commit but untracked files present (use "git add" to track)
~/todo-app (main) $ rm junk.txt          # remove it yourself
```

`git restore` only puts back files Git tracks. A brand-new file was never in a commit, so Git leaves it alone, and you delete it with `rm`.

> [!TIP] Commit before a big change
> A commit is the save point `git restore .` goes back to. Make one before you try anything risky.

```sandbox-exercise
id: fix-the-last-commit
title: "Practice: tidy up after a mistake"
mode: guided
brief: "Search is finished but not committed: `app.txt` has its new line, and `search.txt` is new. You'll commit it, and fix three small mistakes along the way."
seed:
  dir: todo-app
  setup:
    - story: after-stash
goals:
  - id: staged-everything
    label: Search is staged, and so is a test limit that shouldn't be
    narration: >-
      To test search on a huge list, set the limit with `echo "MAX_TASKS = 9999" > settings.txt`. Search works, so stage everything with `git add .` and run `git status`.
    check:
      kind: files-staged
      paths: [ app.txt, search.txt, settings.txt ]
    hints:
      - Change the limit first, then stage the whole folder.
      - >-
        Run `echo "MAX_TASKS = 9999" > settings.txt`, then `git add .`.
  - id: limit-unstaged
    label: "`settings.txt` is out of the staging area, and search is still in"
    narration: The test limit got staged too. Take `settings.txt` out of the staging area, then throw the edit away.
    check:
      kind: all-of
      checks:
        - kind: files-staged
          paths: [ app.txt, search.txt ]
        - kind: not
          check:
            kind: files-staged
            paths: [ settings.txt ]
    hints:
      - Both commands are `git restore`, first with `--staged`, then without.
      - Run `git restore --staged settings.txt`, then `git restore settings.txt`.
  - id: committed-with-typo
    label: "Search is committed, as `feat: add serch`"
    narration: >-
      Now commit in a hurry, typo and all: `git commit -m "feat: add serch"`.
    check:
      kind: all-of
      checks:
        - kind: head-message
          includes: "feat: add serch"
        - kind: working-tree-clean
    hints:
      - If `git status` still shows `settings.txt` as modified, run `git restore settings.txt` first.
      - >-
        Run `git commit -m "feat: add serch"`.
  - id: message-fixed
    label: "The newest commit says `feat: add search`"
    narration: Fix the message by replacing the commit, not by adding another one.
    check:
      kind: head-message
      includes: "feat: add search"
    hints:
      - The flag that replaces the last commit is `--amend`.
      - >-
        Run `git commit --amend -m "feat: add search"`.
  - id: help-folded
    label: "`search-help.txt` is in that commit too"
    narration: >-
      Search needs a line of help. Write it with `echo "Type a word to find matching tasks." > search-help.txt`, stage it, and put it in the same commit with `--no-edit`.
    check:
      kind: all-of
      checks:
        - kind: head-message
          includes: "feat: add search"
        - kind: commit-exists
          containing: [ search.txt, search-help.txt ]
        - kind: commit-count
          count: 13
        - kind: working-tree-clean
    hints:
      - Stage the new file first, because amend picks up whatever is staged.
      - Run `git add search-help.txt`, then `git commit --amend --no-edit`.
detours:
  - id: extra-commit
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ search-help.txt ]
        - kind: not
          check:
            kind: commit-count
            count: 13
    message: That made a new commit for the help text, and it belongs in the search commit. Press **Start over**, and use `git commit --amend --no-edit` after staging the file.
  - id: settings-folded
    check:
      kind: commit-exists
      containing: [ search.txt ]
      modifies: [ settings.txt ]
    message: The `9999` limit went into your commit. Press **Start over**, and unstage `settings.txt` before you commit.
completionMessage: One search commit, the right message, the help text inside it, and a clean folder. Amend and restore fix most mistakes before anyone else sees them.
```

```quiz
id: quiz-unstage-and-discard
question: You staged a rewrite of `app.txt`, then decided against it. You want the last committed version back. What do you run?
options:
  - text: Unstage it, then plain restore it
  - text: "`git restore app.txt` on its own"
    whyWrong: The rewrite is staged, so plain restore copies it right back.
  - text: "`git restore --staged app.txt` on its own"
    whyWrong: That unstages it, but the rewrite stays in your folder.
  - text: "`git commit --amend --no-edit`"
    whyWrong: That puts the rewrite into your last commit.
correctIndex: 0
explanation: Unstaging puts the committed version back in the staging area, then plain restore copies it into your folder.
```

## Recap {#recap}

You can now:

- Unstage a file without losing your edits
- Throw away edits you don't want
- Fix the message or files of your last commit
- Go back to your last commit in one command

```bash
git restore --staged <file>    # unstage, keep your edits
git restore <file>             # throw away unstaged edits, no undo
git restore .                  # same, for every file
git commit --amend -m "..."    # replace the last commit
git commit --amend --no-edit   # same, keep the message
```

Next up: keeping a copy of your project online.
