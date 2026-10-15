---
id: 11
title: Set up your computer
description: Install Git and GitHub CLI and connect to your GitHub account
unlocks: []
---

## Leave the practice terminal {#leave-practice}

You've finished the practice lessons. Now install Git and GitHub CLI on your computer and sign in to your GitHub account.

After setup, you'll download the project files from the end of the course and use the same workflow in your own repository.

## Make a GitHub account {#github-account}

Create a GitHub account at [github.com/signup](https://github.com/signup) and verify your email address. If you already have an account, sign in to it.

Git records an email address in each commit. To use GitHub's private `noreply` address instead of your personal email:

1. Open your [GitHub email settings](https://github.com/settings/emails).
2. Enable "Keep my email addresses private".
3. Copy the address ending in `@users.noreply.github.com`. You'll use it when configuring Git.

## Get a package manager {#package-manager}

A **package manager** installs and updates programs using commands.

:::tabs os Choose your computer
::tab Windows
Open PowerShell and check whether `winget`, the Windows package manager, is available:

```bash
winget --version
```

If a version number appears, it's ready to use. If the command isn't recognised, install or update [App Installer from the Microsoft Store](https://apps.microsoft.com/detail/9nblggh4nns1), which includes `winget`.

If you can't use the Store, download the `.msixbundle` file under Assets on the [latest WinGet release](https://github.com/microsoft/winget-cli/releases/latest) and open it to install.

After installation, reopen PowerShell and run `winget --version` again. A version number starting with `v` confirms it's working.

::tab Mac
Open Terminal and install Homebrew by running the command from [brew.sh](https://brew.sh):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> [!INFO] Typing your password
> If the installer asks for your Mac login password, no characters or asterisks appear as you type. Type the password and press Enter.

When installation finishes, run any commands listed under "Next steps" so Terminal can find Homebrew. Then check it works:

```bash
brew --version
```

You should see a line starting with `Homebrew` followed by a version number.

::tab Linux
Linux usually has a package manager installed already. Open Terminal and run the command for your system:

```bash
apt --version   # Ubuntu or Debian
dnf --version   # Fedora
```

A version number confirms it's available. You'll use it to install Git and GitHub CLI next.

Installation commands often start with `sudo` (superuser do), which runs a command with administrator permissions.

> [!INFO] Typing your password
> If a `sudo` command asks for your login password, no characters or asterisks appear as you type. Type the password and press Enter.

:::

## Install Git and GitHub CLI {#install}

The practice terminal included Git and GitHub CLI (`gh`). With a package manager ready, install both on your computer:

:::tabs os Choose your computer
::tab Windows
In PowerShell, install both programs:

```bash
winget install --id Git.Git -e --source winget    # install Git
winget install --id GitHub.cli --source winget   # install GitHub CLI
```

::tab Mac
In Terminal, install both programs:

```bash
brew install git   # install Git
brew install gh    # install GitHub CLI
```

::tab Linux
On Ubuntu or Debian, update the package list and install Git:

```bash
sudo apt update        # update the package list
sudo apt install git   # install Git
```

Then install `gh` using [GitHub CLI's Debian and Ubuntu instructions](https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian).

On Fedora, install both programs with:

```bash
sudo dnf install git   # install Git
sudo dnf install gh    # install GitHub CLI
```

For another Linux distribution, use the [Git installation guide](https://git-scm.com/install/linux) and [GitHub CLI installation guide](https://github.com/cli/cli/blob/trunk/docs/install_linux.md).
:::

## Check the installed tools {#check-tools}

:::tabs os Choose your computer
::tab Windows
Close PowerShell and open Git Bash, which was installed with Git. Use it for the remaining lessons. The navigation and Git commands you've practised work there too.

If Ctrl+V doesn't paste, use Shift+Insert.

::tab Mac
Open a new Terminal window so it picks up the installed programs.

::tab Linux
Open a new Terminal window so it picks up the installed programs.
:::

Your prompt may look different from the practice terminal. On a Mac it may end in `%` instead of `$`. Type the commands after it as before.

Run both version checks. The output below is an example, so your version numbers may differ:

```terminal
~ $ git --version
git version 2.51.0
~ $ gh --version
gh version 2.78.0 (2025-08-21)
https://github.com/cli/cli/releases/tag/v2.78.0
~ $
```

A `git version` line and a `gh version` line confirm that both programs are available.

> [!TIP] Return from a long list
> Commands such as `git log` and `git diff` may open a **pager**, a view for reading output a screen at a time. If the output fills the terminal and the prompt is missing, press `q` to return to it.

## Tell Git who you are {#identity}

Set the author name and email Git will record in your commits on this computer. Replace the examples with your name and the `noreply` email copied from GitHub:

```bash
git config --global user.name "Ada Lovelace"
git config --global user.email "12345678+adalovelace@users.noreply.github.com"
```

To check a setting, run the same command without its value. Git prints the value it has stored:

```terminal
~ $ git config --global user.name
Ada Lovelace
~ $ git config --global user.email
12345678+adalovelace@users.noreply.github.com
~ $
```

## Set your Git defaults {#git-defaults}

Set two defaults so Git behaves like the practice terminal. New repositories will start on `main`, and `git pull` will combine histories with a merge when needed. This matches the merge behaviour used in the practice lessons.

```bash
git config --global init.defaultBranch main   # start new repositories on main
git config --global pull.rebase false         # pull uses a merge when needed
```

Read both settings back to check them:

```terminal
~ $ git config --global init.defaultBranch
main
~ $ git config --global pull.rebase
false
~ $
```

## Set up Nano {#editor}

Git opens an editor for the message when you run `git commit` without `-m`. It may also open one for a merge commit's prepared message. The practice terminal skipped this editor step.

Choose Nano so you know which editor to expect. First, check that it's available:

```bash
nano --version
```

A version line confirms Nano is available. If the command isn't found, use `brew install nano` on Mac, `sudo apt install nano` on Ubuntu or Debian, or `sudo dnf install nano` on Fedora. On Windows, Nano comes with the Git installation and is available in Git Bash.

Once Nano is available, make it Git's editor and read the setting back:

```terminal
~ $ git config --global core.editor nano
~ $ git config --global core.editor
nano
~ $
```

When Git opens Nano, write the message or keep the prepared merge message. Press Ctrl+O to save, Enter to confirm the file name, and Ctrl+X to close. Nano shows shortcuts along the bottom, where `^` means Ctrl.

```quiz
id: quiz-editor
question: You run `git commit` without `-m` on your computer. Why does a text editor open?
options:
  - text: Git needs an editor for the commit message
  - text: Git needs you to choose which files to stage
    whyWrong: You choose the files with `git add` before committing. This editor is for the message.
  - text: Git has finished committing and opened the app
    whyWrong: Git is still waiting for you to save a message and close the editor.
correctIndex: 0
explanation: Without `-m`, Git opens its configured editor so you can write the commit message.
```

## Sign in to GitHub {#sign-in}

Git is configured. Use `gh auth login` to connect GitHub CLI to your account through browser sign-in.

Choose GitHub.com, HTTPS, and browser sign-in. Answer Yes when asked to authenticate Git too, so it can use the same sign-in. Enter the code printed in your terminal on the page that opens:

```terminal
~ $ gh auth login
? Where do you use GitHub? GitHub.com
? What is your preferred protocol for Git operations on this host? HTTPS
? Authenticate Git with your GitHub credentials? Yes
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: 1A2B-3C4D
Press Enter to open https://github.com/login/device in your browser...
✓ Authentication complete.
- gh config set -h github.com git_protocol https
✓ Configured git protocol
✓ Logged in as your-username
~ $
```

HTTPS is the connection method used in this course. After signing in, run `gh auth status` and check that it lists your GitHub username:

```terminal
~ $ gh auth status
github.com
  ✓ Logged in to github.com account your-username (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo'
~ $
```

## Recap {#recap}

You can now:

- Install and check Git and GitHub CLI
- Set up Git's name, email, and editor
- Sign in to GitHub from the terminal

```bash
git --version                                 # check Git is installed
git config --global init.defaultBranch main   # new repositories start on main
git config --global pull.rebase false         # pull by merging
git config --global core.editor nano          # write messages in Nano
gh auth login                                 # sign in to GitHub
gh auth status                                # check you're signed in
```

Next up: download the project files and take them from an initial commit to a pull request.
