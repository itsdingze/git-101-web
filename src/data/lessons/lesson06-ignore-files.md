---
id: 6
title: Ignore Files
description: Keep your own files and throwaway work out of your commits
unlocks: []
---

## Files that don't belong {#why-gitignore}

Your app loads its list from a file called `tasks.txt`, and that file doesn't exist yet. Let's give the app a first task to show:

```bash
~/todo-app (main) $ echo "Buy milk" > tasks.txt
~/todo-app (main) $ git status
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	tasks.txt                            # Git offers to commit your shopping

nothing added to commit but untracked files present (use "git add" to track)
```

`tasks.txt` is your own to-do list. It isn't part of the app, and anyone who gets a copy of the project would get your errands with it. Two kinds of files never belong in a commit:

- Private things: your own data, like `tasks.txt`, and secrets like passwords, which many projects keep in a file called `.env`.
- Throwaway things: experiments you'll delete, and the logs and other junk your tools leave behind.

`git add .` stages everything in the folder, so one careless commit takes them all.

## Write the rules {#gitignore-rules}

A file called `.gitignore` keeps them out. It lists what to skip, one rule per line, and Git leaves matching files out of `git status` and `git add .`.

The simplest rule is a file's name. Let's write one and watch `tasks.txt` drop off the list:

```bash
~/todo-app (main) $ echo "tasks.txt" > .gitignore   # the rule is the file's name
~/todo-app (main) $ git status
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.gitignore                           # your rules, a new file

nothing added to commit but untracked files present (use "git add" to track)
```

`.gitignore` starts with a dot, so it's hidden, just like `.git`, and only `ls -a` lists it.

## Match many files with one rule {#gitignore-patterns}

Next on your ideas list is due dates. Before you change the app, you try the idea out in a throwaway file. You'll make more of these, and naming each one in `.gitignore` would never end. A rule can match many files at once:

```bash
~/todo-app (main) $ echo "show_due(tasks)" > try-dates.txt   # an experiment, not for committing
~/todo-app (main) $ echo "try-*" >> .gitignore   # >> adds a rule and keeps the one above
~/todo-app (main) $ echo "notes/" >> .gitignore  # your notes are private too
~/todo-app (main) $ cat .gitignore
tasks.txt    # one exact file
try-*        # every name starting with try-
notes/       # the notes folder and everything in it
```

- `*` is a **wildcard**. It stands for any characters, so `try-*` matches `try-dates.txt` and any `try-search.txt` you make later. In the same way, `*.log` would match every file ending in `.log`.
- A `/` at the end means a folder, and the rule covers everything inside it.
- A rule works in every folder of the project, so `try-*` also skips `notes/try-colors.txt`.

## Check what Git skips {#checking-ignored}

Ignored files never show up in `git status`, so a broken rule is hard to spot. The `--ignored` flag lists what Git skips:

```bash
~/todo-app (main) $ git status --ignored
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.gitignore                           # your rules, not committed yet

Ignored files:                           # what your rules keep out
  (use "git add -f <file>..." to include in what will be committed)   # -f forces it in, rarely wanted
	tasks.txt
	try-dates.txt

nothing added to commit but untracked files present (use "git add" to track)
```

`notes/` is missing from the ignored list, even though you wrote a rule for it. Your notes went into your first commit, so Git already tracks them, and a rule only covers files Git isn't tracking yet. The next lesson fixes that.

> [!TIP] Commit .gitignore itself
> Commit `.gitignore` like any other file, so everyone with the project gets the same rules.

Committing `.gitignore` adds no feature and fixes no bug, so its message gets a fourth type. `chore:` means housekeeping, as in `chore: ignore my tasks and experiments`.

## Rules first on a new project {#rules-before-first-commit}

Your notes slipped into your first commit because `git add .` ran before any rule existed. On your next project, write `.gitignore` before your first commit. Then `git add .` is safe, because it stages everything except what your rules skip. That's how most first commits are made, with no need to add files one by one:

```bash
git init                              # start the repository
echo "tasks.txt" > .gitignore         # write your rules first
echo "notes/" >> .gitignore
git status                            # read the list before you stage
git add .                             # stage everything the rules don't skip
git commit -m "feat: add task list"   # the first commit, rules included
```

> [!TIP] Read the list before `git add .`
> `git status` lists exactly what `git add .` will stage. If a file you don't want is on it, write a rule for it first.

## Start from a template {#gitignore-templates}

On bigger projects, most of what you ignore is junk your tools make. Macs put a `.DS_Store` file in every folder, Python makes `__pycache__/` folders, and web projects download a `node_modules/` folder.

You don't need to know them all. [gitignore.io](https://www.toptal.com/developers/gitignore) builds a file from your language, editor, and computer, and an AI tool can write one too.

> [!INFO] Know the rule anyway
> However you get the file, check it covers your private files and your junk. Never commit either.

```quiz
id: quiz-gitignore-pattern
question: You try ideas out in `try-dates.txt` and `try-search.txt`. You add the line `try-*` to `.gitignore`. What happens?
options:
  - text: Git stops offering to commit both
  - text: Git deletes both files
    whyWrong: A `.gitignore` never deletes anything from your folder.
  - text: Nothing, a rule must name each file
    whyWrong: The `*` matches any characters, so `try-*` covers both.
  - text: Only `try-dates.txt` is ignored, the first match
    whyWrong: A rule covers every file it matches, not just the first.
correctIndex: 0
explanation: One `try-*` rule covers every experiment, including ones you make later.
```

```sandbox-exercise
id: ignore-rules-in-practice
title: "Practice: keep your own files out"
mode: guided
brief: "`todo-app` has three commits, and everything in the folder is tracked. You're about to make two files that should never be committed: your own task list, and an experiment."
seed:
  dir: todo-app
  setup:
    - story: after-see-what-changed
goals:
  - id: tasks-ignored
    label: "`tasks.txt` exists, and Git ignores it"
    narration: >-
      Give the app a first task with `echo "Buy milk" > tasks.txt`, and run `git status` to see Git offer to commit it. Start a `.gitignore` with `echo "tasks.txt" > .gitignore`, then run `git status` again.
    check:
      kind: file-ignored
      path: tasks.txt
    hints:
      - A file called `.gitignore` holds the rules, one per line.
      - >-
        Run `echo "Buy milk" > tasks.txt`, then `echo "tasks.txt" > .gitignore`.
  - id: experiments-ignored
    label: "`try-dates.txt` exists, and Git ignores it too"
    narration: >-
      Try out due dates in a throwaway file with `echo "show_due(tasks)" > try-dates.txt`. Then add a rule for every name starting with `try-`, using `>>` so your first rule stays.
    check:
      kind: file-ignored
      path: try-dates.txt
    hints:
      - Two arrows, `>>`, add a line to the end of a file, and `*` stands for any characters.
      - >-
        Run `echo "show_due(tasks)" > try-dates.txt`, then `echo "try-*" >> .gitignore`.
  - id: rules-committed
    label: "`.gitignore` has a third rule, and it's committed"
    narration: >-
      Your notes are private too, so add the rule `notes/`. Run `git status --ignored` and notice `notes/` isn't listed, because Git already tracks it. Then commit `.gitignore` with a `chore:` message.
    check:
      kind: all-of
      checks:
        - kind: file-line-count
          path: .gitignore
          atLeast: 3
        - kind: file-tracked
          path: .gitignore
        - kind: working-tree-clean
    hints:
      - Add the rule with `>>`, then stage `.gitignore` and commit it.
      - >-
        Run `echo "notes/" >> .gitignore`, then `git add .gitignore`.
      - >-
        Then run `git commit -m "chore: ignore my tasks and experiments"`.
detours:
  - id: rules-overwritten
    check:
      kind: all-of
      checks:
        - kind: file-present
          path: tasks.txt
        - kind: file-present
          path: .gitignore
        - kind: file-ignored
          path: try-dates.txt
        - kind: not
          check:
            kind: file-ignored
            path: tasks.txt
    message: >-
      The `tasks.txt` rule is gone, because a single `>` replaced the whole file. Put it back with `echo "tasks.txt" >> .gitignore`, then run `cat .gitignore` to check.
  - id: tasks-committed
    check:
      kind: commit-exists
      containing: [ tasks.txt ]
    message: >-
      `tasks.txt` went into a commit, shopping and all, because no rule covered it yet. Press **Start over**, and write the rule before you stage anything.
completionMessage: Your task list and your experiments stay out, and the rules travel with the project. One rule didn't take, though. Git still tracks your notes, and the next lesson fixes that.
```

## Recap {#recap}

You can now:

- Keep your own files and throwaway work out with `.gitignore`
- Match many files with one rule
- Check which files Git is skipping
- Write your rules before a project's first commit
- Start from a template for your tools

```bash
echo "tasks.txt" >> .gitignore   # add a rule
git status --ignored             # list the files Git skips
git add .                        # stage everything your rules don't skip
```

Next up: getting Git to let go of your notes, which it already tracks.
