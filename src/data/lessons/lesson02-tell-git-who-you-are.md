---
id: 2
title: Tell Git Who You Are
description: Put your name on every commit you make
unlocks: [ config ]
---

## Sign your work {#your-identity}

Every commit is stamped with a name and an email, so anyone reading the history knows who made each change. That includes you, months from now, wondering why a line is there.

Git won't guess who you are. If you try to commit before telling it, Git stops with a message like this:

```text
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
```

The `***` only makes that line stand out. Git even prints the fix, the two `git config` lines in the middle. Each computer only needs them once.

## Set your name and email {#set-identity}

Two commands tell Git who you are. One sets your name and the other your email, each inside quotes:

```bash
git config --global user.name "Ada Lovelace"       # set your name
git config --global user.email "ada@example.com"   # set your email
```

Read the first one piece by piece:

- Every Git command starts with the word `git`, then the name of the command. Here that's `config`, short for configure.
- `git config` changes one of Git's **settings**.
- `--global` is a **flag**, an extra option that starts with dashes. This one means "for every project on this computer", so you never set it again.
- `user.name` is the name of the setting, and `"Ada Lovelace"` is its new value.

> [!WARNING] Keep the quotes
> A name with a space needs quotes. Without them, Git keeps just `Ada` and gives no error.

> [!TIP] Any email works here
> This practice terminal accepts any address. When you set up your own computer, you'll use one GitHub gives you, so your commits link to your account.

## Check your settings {#check-settings}

The same command without a value reads a setting back, and `git config --list` shows every setting at once:

```bash
~/todo-app $ git config user.name     # no value, so Git reads it
Ada Lovelace
~/todo-app $ git config --list        # every setting at once
user.name=Ada Lovelace
user.email=ada@example.com                # your own computer lists more settings
```

If `git config user.name` prints nothing, your name isn't set yet.

```block-exercise
id: build-config
prompt: "Build the command that sets your name for every project on this computer:"
availableBlocks: [ git, config, --global, user.name, '"Ada Lovelace"', user.email, --list ]
correctAnswer: [ git, config, --global, user.name, '"Ada Lovelace"' ]
decoyReasons:
  user.email: "`user.email` is your email, and this command sets your name."
  --list: "`--list` shows your settings without changing any."
hints:
  - Start with `git config`.
  - For every project, add the `--global` flag.
  - The full command is `git config --global user.name "Ada Lovelace"`.
```

```sandbox-exercise
id: sign-your-work
title: "Practice: sign your work"
mode: guided
brief: You're back in `todo-app`. Before your first commit, tell Git your name and email.
seed:
  dir: todo-app
  identity:
    name: ""
    email: ""
  setup:
    - story: after-terminal-basics
goals:
  - id: set-name
    label: Git knows your name
    narration: Set your name for every project with `git config --global user.name`, followed by your name in quotes.
    hints:
      - The setting is `user.name`, and `--global` makes it apply everywhere.
      - Put the name in quotes, because it has a space in it.
      - Run `git config --global user.name "Ada Lovelace"`, with your own name.
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
  - id: set-email
    label: Git knows your email
    narration: Now set your email the same way, with `user.email`. Then run `git config --list` to check both.
    hints:
      - It's the same command as before, with `user.email` in place of `user.name`.
      - Run `git config --global user.email "ada@example.com"`, with your own address.
    check:
      kind: config-set
      key: user.email
detours:
  - id: placeholder-name
    check:
      kind: config-equals
      key: user.name
      value: Your Name
    message: Git now thinks your name is literally "Your Name". Run the command again with your own name in the quotes.
completionMessage: Git knows who you are. Every commit you make from here on carries your name and email.
```

```quiz
id: quiz-config
question: Last week you set your name with `--global`. Today you start a new project. Whose name goes on its commits?
options:
  - text: Yours, because `--global` covers every project
  - text: Nobody's, until you set it again in that project
    whyWrong: Git only stops you when it has no name anywhere, and your global one counts.
  - text: Whatever name your GitHub account uses
    whyWrong: GitHub never changes the settings on your computer.
  - text: Only the projects you'd already started
    whyWrong: "`--global` covers every project on this computer, including ones you start later."
correctIndex: 0
explanation: Global settings live on your computer, so every new project picks them up.
```

## Recap {#recap}

You can now:

- Tell Git your name and email, once
- Read back any setting
- Spot a flag in a command

```bash
git config --global user.name "Ada Lovelace"       # set your name everywhere
git config --global user.email "ada@example.com"   # set your email everywhere
git config user.name                   # read one setting back
git config --list                      # show every setting
```

Next up: you turn `todo-app` into a Git repository.
