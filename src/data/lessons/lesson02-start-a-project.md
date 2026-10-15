---
id: 2
title: Start a project
description: Start a repository and set the name and email for your commits
unlocks: [init, config]
---

## Meet the to-do app {#your-project}

We've prepared a project called `todo-app` inside `projects`. It holds the Python files for a to-do app, and their functions are outlines of what each part does.

You'll use this project throughout the course. It starts with three files:

- `app.py` contains outlines for the app's code.
- `tasks.txt` contains sample tasks.
- `debug.log` contains a sample message, the kind an app writes to record what it did.

Here's how the project folder looks now:

```files ~/projects/todo-app
documents/
  letter.txt
projects/
  recipes/
    soup.txt
  todo-app/
    app.py
    debug.log
    tasks.txt
```

## Read the file previews {#file-previews}

The editor below shows the files we've created. Select a file's tab to read it.

A green line marked `+` shows added text. All three files are new, so every line is green.

A `.py` file contains Python code. Here, each `def` starts a **function**, a named block of code for one job. Comments starting with `#` describe the intended job, and `pass` leaves it unwritten.

```diff ~/projects/todo-app/app.py
+def load_tasks() -> None:
+    # Read tasks from tasks.txt.
+    pass
+
+def show_tasks() -> None:
+    # Show all tasks.
+    pass
```

```diff ~/projects/todo-app/tasks.txt
+Buy milk
+Call the dentist
```

```diff ~/projects/todo-app/debug.log
+app started
```

## Start a repository {#git-init}

`todo-app` is an ordinary folder with no Git history. **Initialising** it sets up a place for Git to store commits.

Go into the project folder, then run `git init`. Every Git command starts with `git`, then the command's name:

```terminal
~ $ cd projects/todo-app
~/projects/todo-app $ git init           # initialise a repository
Initialized empty Git repository in /home/user/projects/todo-app/.git/
~/projects/todo-app (main) $             # the prompt now shows (main)
```

You've made `todo-app` a **Git repository**, a project whose history Git can record. No commits exist yet. The prompt shows `main`, your current **branch**, or line of work.

## The hidden `.git` folder {#hidden-git}

Git stores its history and settings in a new folder called `.git`, inside `todo-app`. You don't need to edit the files inside it. A name that starts with a dot makes a file or folder **hidden**, so plain `ls` skips it.

Add `-a` (all) to see hidden files. An extra option like `-a` is called a **flag**, and it starts with a dash:

```terminal
~/projects/todo-app (main) $ ls
app.py  debug.log  tasks.txt
~/projects/todo-app (main) $ ls -a          # all, hidden ones too
.  ..  .git  app.py  debug.log  tasks.txt
~/projects/todo-app (main) $
```

The file explorer below shows the project after `git init`, including the hidden `.git` folder:

```files ~/projects/todo-app
documents/
  letter.txt
projects/
  recipes/
    soup.txt
  todo-app/
    .git/
      config
      HEAD
      hooks/
      info/
      objects/
        info/
        pack/
      refs/
        heads/
        tags/
    app.py
    debug.log
    tasks.txt
```

```quiz
id: quiz-init-folder
question: Your prompt shows `~ $`, and you run `git init`. Which folder becomes a repository?
options:
  - text: Your home folder, `~`
  - text: "`todo-app`, because it's your project"
    whyWrong: Git doesn't know which folder is your project. It uses the folder you're in.
  - text: None, until you add a folder's name
    whyWrong: "`git init` needs no name. It works on the folder you're in."
correctIndex: 0
explanation: "`git init` starts a repository in the folder you're in, so check the prompt first."
```

## Set your name and email {#your-identity}

Git records an author name and email with each commit. You set them with `git config`. These details identify the author in the history.

Use the example details while practising:

```bash
git config --global user.name "Ada Lovelace"       # set your name
git config --global user.email "ada@example.com"   # set your email
```

Read the first command piece by piece:

- `config` is short for configure. `git config` changes one of Git's **settings**.
- `--global` sets the default for your user account on this computer. A project can override it. Long flags, such as `--global`, start with two dashes.
- `user.name` is the name of the setting, and `"Ada Lovelace"` is its new value.

## Check your settings {#check-settings}

Run `git config --list` to check the current settings:

```terminal
~/projects/todo-app (main) $ git config --list
user.name=Ada Lovelace
user.email=ada@example.com
core.repositoryformatversion=0     # Git's own settings
core.filemode=true
core.bare=false
core.logallrefupdates=true
~/projects/todo-app (main) $
```

Look for `user.name` and `user.email`. Their position may differ from this example. The `core.` lines are other Git settings for this repository.

```block-exercise
id: build-config
prompt: "Build the command that sets your default Git author name:"
availableBlocks: [ git, config, --global, user.name, '"Ada Lovelace"', user.email, --list ]
correctAnswer: [ git, config, --global, user.name, '"Ada Lovelace"' ]
decoyReasons:
  user.email: "`user.email` is your email, and this command sets your name."
  --list: "`--list` shows your settings without changing any."
hints:
  - Start with `git config`.
  - For your default setting, add `--global`.
  - The full command is `git config --global user.name "Ada Lovelace"`.
```

```sandbox-exercise
id: start-the-project
title: "Practice: start a repository"
mode: guided
brief: Start in your home folder. Go into `projects/todo-app`, initialise Git, and set an author name and email. Use example details in this practice.
seed:
  dir: projects/todo-app
  start: ""
  identity:
    name: ""
    email: ""
  setup:
    - story: home-files
    - story: project-files
goals:
  - id: in-project
    label: You're in `todo-app`
    narration: Go into the project folder with `cd projects/todo-app`.
    hints:
      - The prompt shows `~`, your home folder. `todo-app` is inside `projects`.
      - Run `cd projects/todo-app`.
    check:
      kind: current-folder
      path: projects/todo-app
  - id: repo
    label: "`todo-app` is a repository"
    narration: Turn `todo-app` into a repository. Git replies with the path of the new `.git` folder.
    hints:
      - Git can record commits in a folder once you initialise it.
      - Run `git init`.
    check:
      kind: all-of
      checks:
        - kind: repo-initialized
        - kind: not
          check:
            kind: repo-above-project
  - id: set-name
    label: Git has an example author name
    narration: Set your default author name with `git config --global user.name`, followed by the name in quotes.
    hints:
      - Use `user.name` for the name and `--global` for your default setting.
      - Put the name in quotes, because it has a space in it.
      - Run `git config --global user.name "Ada Lovelace"`.
    check:
      kind: all-of
      checks:
        - kind: config-set
          key: user.name
        - kind: not
          check:
            kind: config-equals
            key: user.name
            value: Your Name
        - kind: not
          check:
            kind: config-cut-short
            key: user.name
        - kind: not
          check:
            kind: config-multi-valued
            key: user.name
  - id: set-email
    label: Git has an example author email
    narration: Now set your email the same way, with `user.email`.
    hints:
      - It's the same command as before, with `user.email` in place of `user.name`.
      - Run `git config --global user.email "ada@example.com"`.
    check:
      kind: config-set
      key: user.email
  - id: check-settings
    label: You've checked your settings
    narration: Run `git config --list`, and look for `user.name` and `user.email`.
    hints:
      - The `--list` flag shows every setting at once.
      - Run `git config --list`.
    check:
      kind: any-of
      checks:
        - kind: last-command
          startsWith: git config --list
        - kind: last-command
          startsWith: git config --global --list
detours:
  - id: repo-above-project
    check:
      kind: repo-above-project
    message: Git made the repository outside `todo-app`, in a folder above it. Press Start over, run `cd projects/todo-app`, then `git init`.
  - id: repo-inside-project
    check:
      kind: nested-repository
    message: Typing a name after `git init` made a new folder with its own repository inside `todo-app`. Press Start over, then run plain `git init` inside `todo-app`.
  - id: placeholder-name
    check:
      kind: config-equals
      key: user.name
      value: Your Name
    message: Git now thinks your name is literally "Your Name". Run the command again with an example name such as "Ada Lovelace" in quotes.
  - id: misspelled-name-key
    untilGoal: set-name
    check:
      kind: any-of
      checks:
        - { kind: config-set, key: user.nmae }
        - { kind: config-set, key: user.nam }
        - { kind: config-set, key: user.anme }
        - { kind: config-set, key: user.username }
    message: >-
      Git gives no error for a misspelled setting, so it stored your name in a setting it never reads. Run the command again, spelling it `user.name`, with an example full name in quotes.
  - id: name-has-two-values
    check:
      kind: config-multi-valued
      key: user.name
    message: Git now has two names for you, because the extra word didn't match the name already set. Run `git config --global --replace-all user.name "Ada Lovelace"`.
  - id: name-cut-short
    check:
      kind: config-cut-short
      key: user.name
    message: Git kept only the first word of your name, because there were no quotes around it. Run the command again with your full name in quotes.
  - id: misspelled-email-key
    untilGoal: set-email
    check:
      kind: any-of
      checks:
        - { kind: config-set, key: user.emial }
        - { kind: config-set, key: user.emal }
        - { kind: config-set, key: user.emai }
        - { kind: config-set, key: user.mail }
        - { kind: config-set, key: user.e-mail }
    message: >-
      Git gives no error for a misspelled setting, so it stored your email in a setting it never reads. Run the command again, spelling it `user.email`.
completionMessage: "`todo-app` is now a Git repository. New commits will use the author name and email you set."
```

## Recap {#recap}

You can now:

- Turn a folder into a repository
- Find the hidden `.git` folder
- Tell Git your name and email once
- Check your settings

```bash
cd projects/todo-app                                        # go into the project
git init                                           # start a repository here
ls -a                                              # show hidden files too
git config --global user.name "Ada Lovelace"       # set default author name
git config --global user.email "ada@example.com"   # set default author email
git config --list                                  # show every setting
```

Next up: you choose what goes into your first commit.
