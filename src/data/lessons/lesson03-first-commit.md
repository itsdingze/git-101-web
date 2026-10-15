---
id: 3
title: Your first commit
description: Keep unwanted files out, stage your files, and make a commit
unlocks: [status, add, commit]
---

## Choose files for the first commit {#not-every-file}

You're ready for your first commit, the first save point in your project's history. Before you make it, you choose which files go in.

We've added sample tasks to `tasks.txt`. In this example, we'll keep that list out of the project history.

## Git's three places {#three-places}

You record a change in two steps: choose its contents with `git add`, then save a commit with `git commit`. Choosing contents is called **staging**.

Three places help you keep track:

1. The **working directory** contains the files you work on.
2. The **staging area** holds the file versions selected for your next commit.
3. Your **repository history** contains recorded commits, stored inside `.git`.

## Tracked and untracked {#tracked-untracked}

New files start out **untracked**: Git has not yet been told to record them.

Staging a new file starts **tracking** it. Git can then report changes to that file. You'll stage your first files in a moment.

## Check file changes {#git-status}

`git status` asks Git what it sees in your project:

```terminal
~/projects/todo-app (main) $ git status  # what does Git see?
On branch main  # the branch you're on

No commits yet  # nothing recorded so far

Untracked files:  # files Git isn't recording
  (use "git add <file>..." to include in what will be committed)
	app.py
	debug.log
	tasks.txt

nothing added to commit but untracked files present (use "git add" to track)
~/projects/todo-app (main) $
```

All three files are untracked. The lines in parentheses are Git's hints about what to run next.

A word in angle brackets, like `<file>`, is a **placeholder**. You type a real file name in its place, without the brackets.

> [!TIP] Unsure? Run `git status`
> Run `git status` whenever you're unsure what's going on. You'll use it more than any other command.

## Ignore a file {#gitignore}

To leave an untracked file out of normal staging, create a file named `.gitignore` in the project folder. Git reads one ignore rule per line and excludes matching untracked files from normal staging. We've created it with one line for `tasks.txt`:

```diff ~/projects/todo-app/.gitignore
+tasks.txt
```

Now `git status` lists `.gitignore` and leaves out `tasks.txt`:

```terminal
~/projects/todo-app (main) $ git status
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.gitignore  # the ignore file we created
	app.py
	debug.log

nothing added to commit but untracked files present (use "git add" to track)
~/projects/todo-app (main) $
```

```quiz
id: quiz-ignored-file
question: We've listed the untracked `tasks.txt` in `.gitignore`. Where does the file live now?
options:
  - text: In the folder, outside history
  - text: Git deletes it from your folder
    whyWrong: Ignoring never touches the file. It only tells Git to leave it out.
  - text: It goes into your commits, but hidden
    whyWrong: Ignoring an untracked file doesn't add a hidden copy to your commits.
correctIndex: 0
explanation: Ignoring leaves the file on your computer as-is, but Git excludes it from normal staging.
```

## Stage your files {#git-add}

`git add` copies a file's current contents into the staging area, ready for your next commit. If you edit the file again, run `git add` again to include the new edits.

`git add .` stages additions, edits, and deletions in this folder and its subfolders. It leaves out ignored untracked files, such as `tasks.txt`.

```terminal
~/projects/todo-app (main) $ git add .  # stage this folder
~/projects/todo-app (main) $ git status
On branch main

No commits yet

Changes to be committed:  # staged for the next commit
  (use "git rm --cached <file>..." to unstage)
	new file:   .gitignore
	new file:   app.py
	new file:   debug.log

~/projects/todo-app (main) $
```

`git status` now lists all three files under `Changes to be committed`. These are the files selected for the first commit.

```block-exercise
id: build-add
prompt: "Build the command that stages everything in this folder:"
availableBlocks: [ git, add, commit, ., app.py, status ]
correctAnswer: [ git, add, . ]
decoyReasons:
  commit: "`commit` records what's staged, so staging comes first."
  app.py: "`app.py` names one file, and the dot covers everything."
  status: "`git status` reports what changed without staging anything."
hints:
  - Start with `git add`.
  - A dot means everything in the folder you're in.
  - The full command is `git add .`.
```

## Write a commit message {#commit-messages}

A **commit message** is a short note saying what the commit changes. Choose a specific description so you can recognise it later.

For this first commit, use `feat: add task list`. The `feat:` prefix identifies a new feature.

Git itself does not require these prefixes. This course uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to keep messages consistent. You'll learn the other types in the next lesson.

## Make the commit {#git-commit}

`git commit` records the project's staged snapshot. Unchanged files remain in that snapshot too.

The `-m` flag (m for message) adds the commit message. Put the message in quotes because it has spaces:

```terminal
~/projects/todo-app (main) $ git commit -m "feat: add task list"
[main (root-commit) 8c7821f] feat: add task list
 3 files changed, 9 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 app.py
 create mode 100644 debug.log
~/projects/todo-app (main) $
```

The first line in the response starts with your branch, `main`. `root-commit` means it's the first commit in the repository.

`8c7821f` is the start of the commit's **hash**, a unique ID Git gives every commit. `create mode` lines mean each file is new to this repository.

Here's the complete flow: choose file contents with `git add`, then record them with `git commit`. Step through the diagram to see the working directory, staging area, and repository at each point.

```visualization three-place-model
files: [ .gitignore, app.py, debug.log ]
ignored: [ tasks.txt ]
stageFirst: app.py
commitMessage: "feat: add task list"
```

## Check for uncommitted changes {#clean-status}

The first commit now contains all the project files except the ignored `tasks.txt`. There should be no pending changes for Git to report. Run `git status` to check:

```terminal
~/projects/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean  # matches your last commit
~/projects/todo-app (main) $
```

Git also calls the working directory the **working tree**. A clean status means there are no staged changes, unstaged changes to tracked files, or untracked files to report.

```sandbox-exercise
id: first-commit
title: "Practice: make a commit"
mode: guided
brief: We've created `.gitignore` with a rule for `tasks.txt`. You're in `todo-app`. Stage the project files, make a `feat:` commit, and run `git status` to check for remaining changes.
seed:
  dir: projects/todo-app
  setup:
    - story: home-files
    - story: after-start-a-project
    - write:
        .gitignore: |
          tasks.txt
goals:
  - id: status
    label: You've asked Git what it sees
    narration: Run `git status` to see which files Git lists as untracked.
    hints:
      - The command asks Git for the status of your project.
      - Run `git status`.
    check:
      kind: last-command
      startsWith: git status
  - id: staged
    label: Your files are staged
    narration: Stage everything with `git add .`, then run `git status` to see your files under `Changes to be committed`.
    hints:
      - A dot means everything in the folder you're in.
      - Run `git add .`, then `git status`.
    check:
      kind: any-of
      checks:
        - kind: all-of
          checks:
            - kind: files-staged
              paths: [ .gitignore, app.py, debug.log ]
            - kind: last-command
              startsWith: git status
        - kind: commit-exists
          containing: [ .gitignore, app.py, debug.log ]
  - id: committed
    label: Your files are in a commit with a `feat:` message
    narration: Commit what you staged with `git commit -m`, followed by a `feat:` message in quotes.
    hints:
      - Staging only picks what goes in, and a separate command makes the commit.
      - The app is a new feature, so the message starts with `feat:`.
      - >-
        Run `git commit -m "feat: add task list"`.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ .gitignore, app.py, debug.log ]
        - kind: head-message
          includes: "feat:"
        - kind: not
          check: { kind: file-tracked, path: tasks.txt }
  - id: clean
    label: Nothing is left to commit
    narration: Run `git status` to check that the working tree is clean.
    hints:
      - "`git status` tells you when there's nothing left to commit."
      - Run `git status`.
    check:
      kind: all-of
      checks:
        - kind: working-tree-clean
        - kind: last-command
          startsWith: git status
detours:
  - id: ignored-file-added
    check:
      kind: last-command
      startsWith: git add tasks.txt
      allowFailure: true
    message: Git refused because `.gitignore` lists `tasks.txt`. We've listed it to keep the sample tasks out, so don't force it in with `-f`. Run `git add .` to stage the other files.
  - id: ignored-file-forced
    check:
      kind: any-of
      checks:
        - kind: files-staged
          paths: [ tasks.txt ]
        - kind: file-tracked
          path: tasks.txt
    message: The `-f` flag forced `tasks.txt` in, though `.gitignore` lists it to keep the sample tasks private. Press Start over, then run `git add .`, which leaves it out.
  - id: message-without-type
    check:
      kind: all-of
      checks:
        - kind: commit-exists
        - kind: not
          check:
            kind: head-message
            includes: "feat:"
    message: "Your commit was saved. This exercise asks for a `feat:` message. Press Start over, stage the files again, and use a message such as `feat: add task list`."
completionMessage: You made your first commit, and `.gitignore` kept the sample tasks out of it. Every file Git tracks now matches that save point.
```

## Recap {#recap}

You can now:

- Check what Git sees in your project
- Keep a file out of Git with `.gitignore`
- Stage files for your next commit
- Commit with a message that says what changed

```bash
git status            # show what Git sees
git add .             # stage changes here, respecting ignore rules
git commit -m "..."   # commit with a message
```

Next up: giving each commit one purpose.
