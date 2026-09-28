---
id: 4
title: Your First Commit
description: Stage your files and commit them with a clear message
unlocks: [ add, commit ]
---

## Pick what goes in {#why-stage}

A commit doesn't have to include every change you've made. You pick which files go into it, and the rest stay in your folder as they are.

Changed five files? You can commit two of them now and leave the other three for a later commit.

That's why a commit takes two commands. First you **stage** the files you want, which sets them aside for your next commit. Then you commit what you staged.

## Git's three places {#three-areas visualization=three-place-model}

So a change passes through three places on its way into your history:

1. The **working directory** is your project folder as it is right now, where you edit files.
2. The **staging area** holds the changes you've set aside for your next commit.
3. The repository holds every commit you've made, inside `.git`.

Two commands move a change along. `git add` takes it from the working directory to the staging area, and `git commit` takes it from the staging area into the repository. The diagram runs both, and the next screens teach them one at a time.

> [!INFO] A commit is a copy
> Committing copies your files into the repository. They stay in your folder too.

## Stage your changes {#staging-files}

`git add` puts a file in the staging area:

```bash
git add app.txt    # stage one file
git add .          # stage everything in this folder
```

The dot in `git add .` means "everything in the folder you're in".

Remember tracked and untracked files? `git add` is what turns an untracked file into a tracked one. From then on, Git notices every change to that file.

## See what you staged {#check-staging}

`git add` prints nothing when it works, so `git status` is how you check:

```bash
~/todo-app (main) $ git add app.txt     # stage just app.txt
~/todo-app (main) $ git status
On branch main

No commits yet

Changes to be committed:                # staged, going into the next commit
  (use "git rm --cached <file>..." to unstage)    # skip this hint for now
	new file:   app.txt

Untracked files:                        # not staged, so left out
  (use "git add <file>..." to include in what will be committed)
	README.md
	notes/
	settings.txt
```

`git status` now sorts your files into two groups. `app.txt` is staged, so it's tracked and sits under `Changes to be committed`. Everything else is still untracked, and a commit made now would leave it out.

```block-exercise
id: build-add
prompt: "Build the command that stages everything in this folder:"
availableBlocks: [ git, add, commit, ., app.txt, status ]
correctAnswer: [ git, add, . ]
decoyReasons:
  commit: "`commit` records what's staged, so staging comes first."
  app.txt: "`app.txt` names one file, and the dot covers everything."
  status: "`git status` reports what changed without staging anything."
hints:
  - Start with `git add`.
  - A dot means everything in the folder you're in.
  - The full command is `git add .`.
```

## Make a commit {#committing}

Once your changes are staged, `git commit` records them as a new save point. The `-m` flag gives the commit its message, the note saying what changed:

```bash
~/todo-app (main) $ git add .           # stage everything else as well
~/todo-app (main) $ git commit -m "feat: add task list"
[main (root-commit) 68cc05c] feat: add task list    # branch, first commit, ID, message
 4 files changed, 6 insertions(+)                   # 4 files, 6 new lines
 create mode 100644 README.md
 create mode 100644 app.txt
 create mode 100644 notes/ideas.txt
 create mode 100644 settings.txt
```

`68cc05c` is the start of the commit's **hash**, a unique ID Git gives every commit, so yours will be different. `root-commit` means it's the first commit in the repository. You can ignore the `create mode` lines, which only say each file is new.

The `feat:` at the start of the message says what kind of change this is, and the next screen covers it.

> [!WARNING] If a text editor opens
> On your own computer, leaving off `-m` may open a text editor called Vim. To get out, press Esc, type `:wq`, and press Enter. Git then says `Aborting commit due to empty commit message`, which is fine, so commit again with `-m`.

## Write a good message {#commit-messages}

Your messages are how you'll find a change again among hundreds of commits. Many teams start each message with its type:

- `feat:` adds a feature, like `feat: add due dates`
- `fix:` fixes a bug, like `fix: stop crash on empty list`
- `docs:` changes docs, like `docs: explain setup in README`

After the type, say what the commit does, as an instruction: `add`, not `added`. Keep it under 50 characters, so it fits on one line wherever history is shown.

> [!INFO] A habit, not a rule
> This style is called [Conventional Commits](https://www.conventionalcommits.org). Git accepts any message, but you'll see this one everywhere.

```quiz
id: quiz-commit-type
question: You fixed a crash that happens when the to-do list is empty. Which message fits?
options:
  - text: "`fix: stop crash on empty list`"
  - text: "`feat: stop crash on empty list`"
    whyWrong: "`feat:` is for new features, and this fixes a bug."
  - text: "`fix: stopped the crash`"
    whyWrong: Messages read as instructions, so use `stop`, not `stopped`.
  - text: "`fix: changes`"
    whyWrong: A message has to say what changed, and `changes` says nothing.
correctIndex: 0
explanation: A bug fix gets `fix:`, then an instruction saying what the commit does.
```

## Check it's all in {#clean-status}

Did the commit take everything? `git status` answers that:

```bash
~/todo-app (main) $ git status
On branch main
nothing to commit, working tree clean   # every file matches your last commit
```

"Working tree" is Git's other name for the working directory. It's **clean** when nothing in it differs from your last commit, so there's nothing to stage and nothing to commit.

A file that hasn't changed since your last commit isn't listed at all. That's why every one of your files has gone from the list.

## Change a file, commit again {#commit-a-change}

Tracking a file doesn't mean Git commits its changes for you. Git only notices them. Ten tasks soon feels like too few, so let's raise the limit to 20 and ask what Git sees:

```bash
~/todo-app (main) $ echo "MAX_TASKS = 20" > settings.txt
~/todo-app (main) $ git status
On branch main
Changes not staged for commit:          # changed since your last commit, not staged
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)   # skip this one for now
	modified:   settings.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

That's the third group `git status` can show. The change goes through the same two steps as before:

```bash
~/todo-app (main) $ git add settings.txt
~/todo-app (main) $ git commit -m "feat: raise the task limit"
[main 06dfe54] feat: raise the task limit
 1 file changed, 1 insertion(+), 1 deletion(-)      # the old line out, the new line in
```

> [!INFO] Stage every time you change
> `git add` stages a file as it is at that moment. Change the file again, and you stage it again.

## Tracked or staged? {#tracked-vs-staged}

These two pairs of words are easy to mix up, because `git add` deals with both. They answer different questions:

- **Tracked or untracked** asks whether Git records a file at all. You settle it once per file. After its first `git add`, a file stays tracked.
- **Staged or unstaged** asks whether a change goes into your next commit. You settle it again for every change, because each commit empties the staging area.

Take `settings.txt`. Its first `git add` made it tracked for good. Each later change starts out unstaged, becomes staged when you run `git add`, and leaves the staging area when you commit.

That's what the three groups in `git status` show:

- `Untracked files` are files Git isn't recording at all.
- `Changes not staged for commit` are tracked files with changes you haven't staged.
- `Changes to be committed` are the changes you've staged.

```quiz
id: quiz-tracked-vs-staged
question: You committed `app.txt` last week. Today you edit it and run `git status`. Where is it listed?
options:
  - text: Under `Changes not staged for commit`
  - text: Under `Untracked files`
    whyWrong: It's been tracked since you first added it. Untracked means Git has never recorded the file.
  - text: Under `Changes to be committed`
    whyWrong: A change is only staged once you run `git add` on it.
  - text: Nowhere, since tracked files commit themselves
    whyWrong: Tracking only means Git notices the change. You still stage it and commit it.
correctIndex: 0
explanation: The file is tracked, and its new change is unstaged until you run `git add`.
```

```sandbox-exercise
id: first-commit-loop
title: "Practice: your first commit"
mode: guided
brief: Git is watching `todo-app`, but nothing is committed yet. Commit every file, then change one and commit that too.
seed:
  dir: todo-app
  setup:
    - story: after-start-a-repository
goals:
  - id: tracked
    label: Git is tracking your files
    narration: Run `git status` and see everything untracked. Stage it all with one command, then run `git status` again.
    check:
      kind: all-of
      checks:
        - kind: file-tracked
          path: app.txt
        - kind: file-tracked
          path: settings.txt
    hints:
      - Run `git status` and look under `Untracked files`.
      - Staging a file is what makes Git start tracking it.
      - Run `git add .` to stage everything.
  - id: committed
    label: Your files are in a commit
    narration: Commit what you staged, with a `feat:` message after `-m`. Then run `git status` to check the working tree is clean.
    check:
      kind: commit-exists
      containing: [ app.txt, settings.txt ]
    hints:
      - Staging only picks what goes in, and committing is a separate command.
      - It's `git commit`, with a message after `-m`.
      - >-
        Run `git commit -m "feat: add task list"`.
  - id: second-commit
    label: A later commit changes a file you'd already committed
    narration: >-
      Ten tasks is too few. Raise the limit with `echo "MAX_TASKS = 20" > settings.txt` and run `git status`. Stage the file again, then commit it.
    check:
      kind: any-of
      checks:
        - kind: commit-exists
          modifies: [ settings.txt ]
        - kind: commit-exists
          modifies: [ app.txt ]
    hints:
      - Change a file first, because a commit needs something new to record.
      - >-
        Run `echo "MAX_TASKS = 20" > settings.txt`, then `git add settings.txt`.
      - >-
        Then run `git commit -m "feat: raise the task limit"`.
completionMessage: That's the core loop of `git status`, `git add`, and `git commit`. You'll run it for the life of every project.
```

## Recap {#recap}

You can now:

- Name Git's three places
- Stage the files for your next commit
- Commit with a message that says what changed
- Stage and commit a file again after changing it
- Pick `feat:`, `fix:`, or `docs:` for a message

```bash
git add <file>        # stage one file
git add .             # stage everything in this folder
git commit -m "..."   # commit with a message
git status            # check what's staged or changed
```

Next up: you see exactly what changed, and read your history.
