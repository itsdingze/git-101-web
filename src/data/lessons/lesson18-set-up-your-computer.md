---
id: 18
title: Set Up Your Computer
description: Install Git, make a GitHub repository, and sign in
unlocks: []
---

## Doing it for real {#the-real-thing}

So far you've practised in a terminal that runs in your browser. Now you'll set Git up on your own computer. After that, you'll put a real project on GitHub, under your name.

This site can't see your computer, so it can't tick off your steps the way the practice terminal did. Instead, each step ends with a "Check it worked" box: a command to run, and what you should see.

Your own prompt won't read `~/todo-app $`. It shows more, like your username and your computer's name, and on a Mac it ends in `%` instead of `$`. The commands work the same.

> [!INFO] Pick your computer once
> Where steps differ, you'll see tabs for Windows, Mac, and Linux. Pick yours once and later steps show only your route.

## Install Git {#install-git}

Git is a program, so the first step is installing it. Then you open a terminal and ask Git which version it is, which proves it's there.

:::tabs os
::tab Windows
1. Download the installer from [git-scm.com/downloads/win](https://git-scm.com/downloads/win) and run it.
2. Click "Next" through the screens, keeping the defaults on all but two.
3. Default editor: pick "Use Nano". Git opens this editor when you need to write a message, and the preselected Vim is hard to get out of.
4. Name of the initial branch: choose "Override the default branch name" and leave `main` in the box, so new repositories start on `main`, like in this course.
5. When it finishes, open the Start menu, type `Git Bash`, and press Enter.

Git Bash is bash for Windows, installed along with Git. Use it for everything here, not PowerShell or Command Prompt, because their commands behave differently. If Ctrl+V doesn't paste, use Shift+Insert.

> [!TIP] Check it worked
> In Git Bash, run `git --version`. You should see a line like `git version 2.47.1.windows.1`.
::tab Mac
Press Cmd+Space to open Spotlight, type `Terminal`, and press Enter. Macs use zsh, which runs every command in this course just like bash. Then ask Git for its version:

```bash
git --version   # which version of Git is installed?
```

If Git is missing, macOS offers to install Apple's developer tools, which include Git. Click "Install", wait for it to finish, then open a new Terminal window and run `git --version` again.

> [!TIP] Check it worked
> You should see a line like `git version 2.39.5 (Apple Git-154)`. If you see `command not found`, open a new Terminal window and try again.
::tab Linux
Open your Terminal app. Each family of Linux has its own command for installing programs, so run the line for yours:

- Ubuntu or Debian: `sudo apt install git`
- Fedora: `sudo dnf install git`
- Arch Linux: `sudo pacman -S git`

`sudo` at the start runs the command as the computer's administrator, so it asks for your computer's password. It may show nothing as you type it.

> [!TIP] Check it worked
> Run `git --version`. You should see a line like `git version 2.47.1`.
:::

## Make a GitHub account {#github-account}

GitHub is the website that keeps a copy of your history online. Sign up at [github.com](https://github.com) if you don't have an account yet.

Every commit carries your email address, and anyone can read it on GitHub. GitHub gives you a private stand-in address to use instead:

1. Click your profile picture in the top-right corner, then Settings, then Emails.
2. Tick "Keep my email addresses private".
3. Copy the address ending in `@users.noreply.github.com` into a note. You'll need it soon.

## Make an empty repository {#github-repository}

Next, make the repository on GitHub that your project will go into. Click + in the top-right corner, choose "New repository", and give it a name. Under the name, choose "Public" or "Private".

Leave "Add a README" off, with no .gitignore or license, then click "Create repository". Anything GitHub adds is a commit your computer doesn't have, and your first push gets rejected because of it.

> [!WARNING] Private for anything personal
> Public means anyone online can read every file. Once someone has copied it, you can't take it back.

> [!TIP] Check it worked
> You see a "Quick setup" page with a URL ending in `.git`. Keep this tab open.

## Tell Git who you are {#identity}

You did this in the practice terminal, and your own computer needs it once too. Use the `noreply` address you copied, so GitHub still links your commits to your profile while your real inbox stays hidden:

```bash
git config --global user.name "Ada Lovelace"   # your name, in quotes
git config --global user.email "12345678+adalovelace@users.noreply.github.com"   # the noreply address
```

Two more settings, also once per computer:

```bash
git config --global init.defaultBranch main   # new repositories start on main
git config --global pull.rebase false         # git pull merges instead of stopping to ask
```

Without the second one, a `git pull` that needs to combine work can stop and ask you to choose how. This course always merges, so the setting answers for you.

> [!TIP] Check it worked
> Run `git config --global --list`. You should see your `user.name` and `user.email`, plus `init.defaultbranch=main` and `pull.rebase=false`.

## Pick Git's editor {#editor}

Some commands open a text editor inside the terminal, with a message already written. A merge commit does it, and so does `git commit` without `-m`. The practice terminal skipped this step, and your own computer won't.

Save and close the editor, and the command finishes.

Which editor you get depends on your settings:

- **Nano** shows `^X Exit` along the bottom, where `^` means the Ctrl key. Press Ctrl+O to save, Enter to keep the file name, then Ctrl+X to close.
- **Vim** shows `~` down the left side, its mark for empty lines, unrelated to your home folder. Press Esc, type `:wq` (write and quit), and press Enter.

Nano is the easier of the two, so make it the editor Git opens. On Windows you already picked it in the installer, and running this again does no harm:

```bash
git config --global core.editor nano   # Git opens Nano from now on
```

> [!TIP] Check it worked
> Run `git config --global core.editor`. You should see `nano`.

## Sign in to GitHub {#authentication}

Before GitHub accepts your pushes, it needs proof they're really from you. How you sign in depends on your computer.

> [!INFO] Your password won't work
> GitHub stopped accepting account passwords for Git in 2021. Pick your computer below for what to use instead.

:::tabs os
::tab Windows
Nothing to do yet. Git came with Git Credential Manager, a helper that handles sign-ins. At your first push, it opens a GitHub sign-in, usually in your browser, and Git remembers you after that.
::tab Mac
Make a **personal access token**: a long code that works like a password, but only for Git, and that you can cancel any time.

1. On GitHub, click your profile picture, then Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Name it, like `my laptop`, and pick an expiration date. After that date, pushes fail with `Authentication failed` until you make a new token.
3. Under "Repository access", choose "Only select repositories" and pick your new repository.
4. Under its permissions, set "Contents" to "Read and write".
5. Click "Generate token" and copy it into a private note now. GitHub shows it only once.

It starts with `github_pat_`. You'll paste it at your first push. For a later project, edit the token on GitHub and add that repository to its access.
::tab Linux
Install the [GitHub CLI](https://cli.github.com), `gh`. It's GitHub's own terminal program, and it can sign Git in for you. Run the line for your system, or follow that page if yours isn't listed:

- Ubuntu or Debian: `sudo apt install gh`
- Fedora: `sudo dnf install gh`
- Arch Linux: `sudo pacman -S github-cli`

Then sign in:

```bash
gh auth login   # sign in to GitHub through your browser
```

It asks a few questions. Answer `GitHub.com`, then `HTTPS`, then yes to authenticating Git, then log in with a web browser. You never handle a password or token yourself.
:::

```quiz
id: quiz-auth
question: At your first `git push`, Git asks for a password. You type your GitHub password, and it's rejected. Why?
options:
  - text: GitHub no longer accepts passwords for Git
  - text: Your password is wrong, so reset it
    whyWrong: The password works on the website, and Git refuses it either way.
  - text: Pushing only works from GitHub's website instead
    whyWrong: You push from your terminal, and the website only shows the result.
correctIndex: 0
explanation: Sign in through your browser or use a token, as your computer's tab shows.
```

## Recap {#recap}

You can now:

- Install Git and open a terminal
- Set your name, private email, and default branch
- Get out of an editor Git opens
- Sign in to GitHub from Git

```bash
git --version                                 # check Git is installed
git config --global user.name "..."           # set your name
git config --global user.email "..."          # set your email
git config --global init.defaultBranch main   # new repositories start on main
git config --global pull.rebase false         # pull with a merge
git config --global core.editor nano          # use Nano for messages
git config --global --list                    # show your settings
gh auth login                                 # sign in on Linux
```

Next up: you push a real project to GitHub.
