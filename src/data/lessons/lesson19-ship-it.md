---
id: 19
title: Ship It
description: Push a real project to GitHub and merge your first pull request
unlocks: []
---

## Pick a project {#push-your-project}

Time to put real work on GitHub. Open your terminal and move into a folder with a project in it.

The quickest way: type `cd` and a space, drag the folder from your file browser into the terminal, and press Enter. The terminal fills in the folder's path for you.

No project yet? Make a small one:

```bash
cd ~                                             # go to your home folder
mkdir my-first-project                           # make directory: create a new folder
cd my-first-project                              # step into it
echo "Things I want to try with Git" > notes.txt   # write a first file
```

## Check what goes in {#check-before-staging}

Everything you commit here ends up online, so look before you stage anything. Start the repository, and ask Git what it sees:

```bash
git init      # make this folder a repository
git status    # list what git add . would stage
```

If the folder is already a repository, skip `git init`. Not sure? Run `git status` first, and if it says `not a git repository`, you need `git init`.

Read the list for anything that shouldn't be online, like a `.env` or a file of passwords. Look for huge files too, because GitHub refuses any file over 100 MB. Add each one to `.gitignore` before you go on, as in `echo ".env" >> .gitignore`.

> [!WARNING] A pushed secret stays pushed
> Deleting a secret later doesn't remove it from your history.

## Send it to GitHub {#first-push}

Now commit and push. Run these one at a time, with the URL from your GitHub tab in place of the example one:

```bash
git add .                             # stage everything that's left
git commit -m "feat: first version"   # your first commit
git remote add origin https://github.com/your-username/your-repo.git   # nickname GitHub's copy origin
git push -u origin main               # send main up, and pair the two
```

:::tabs os
::tab Windows
At `git add`, you may see `LF will be replaced by CRLF`. It's a harmless warning about line endings, with nothing to fix. At `git push`, sign in to GitHub in the window that opens.
::tab Mac
At `git push`, type your GitHub username, then paste your token when it asks for a password, and press Enter. Nothing shows as you paste, and that's normal.
::tab Linux
At `git push`, nothing is asked, because `gh auth login` already signed you in.
:::

> [!TIP] Check it worked
> Refresh your GitHub tab. Your files are there, with your commit message beside them.

## If the push fails {#when-it-fails}

Push errors look alarming, but each one names its problem. Find the message you saw and apply its fix, using your URL in place of `<url>`:

- `src refspec main does not match any`: there's nothing on `main` to send yet. Commit first. If `git branch` shows `master`, rename it with `git branch -m master main`.
- `remote origin already exists`: this folder already has an `origin`. Point it at your URL with `git remote set-url origin <url>`.
- `repository not found`: the URL is wrong. Copy it again from GitHub and use `git remote set-url origin <url>`.
- `rejected` with `fetch first`: GitHub's copy has a commit yours doesn't, usually a README it added. Run `git pull origin main --allow-unrelated-histories` to join the two histories, then push again.

Not on the list? Paste the exact message into a search engine or an AI tool and ask what it means.

> [!INFO] None of these lose work
> Your commits stay on your computer whatever the push says.

## Sign-in problems {#sign-in-problems}

`Authentication failed`, `Permission denied`, or `403` means GitHub didn't accept your sign-in. Often Git remembered an old one. Clear it, then push again:

:::tabs os
::tab Windows
Search the Start menu for Credential Manager, open Windows Credentials, and remove `git:https://github.com`. Push again to sign in afresh.
::tab Mac
Check you pasted the token, with "Read and write" on this repository. For an old token, delete the `github.com` entry in Keychain Access and push again.
::tab Linux
Run `gh auth status`. If it reports a problem, run `gh auth login` again, then push.
:::

```quiz
id: quiz-refspec
question: Your first push fails with `src refspec main does not match any`. What happened?
options:
  - text: Nothing is committed on `main` yet
  - text: GitHub's repository has the wrong name
    whyWrong: A wrong URL says `repository not found` instead.
  - text: Your password or token was rejected
    whyWrong: A sign-in problem says `Authentication failed` or `403` instead.
  - text: The project is too big for GitHub
    whyWrong: Size limits name the file that's too large.
correctIndex: 0
explanation: Git can only push commits, so commit first, then push again.
```

## Your own pull request {#pull-request}

Pull requests aren't only for teams. Trying one on your own repository, with nobody waiting on you, is a safe way to learn the buttons. You'll make a change on a branch and push it.

> [!WARNING] Already have a README?
> The `echo` line below erases everything in `README.md`. If your project has one, skip that line and edit the file in a text editor instead.

```bash
git switch -c update-readme        # a new branch for this change
echo "# My project" > README.md    # write a README
git add README.md                  # stage it
git commit -m "docs: add a README" # commit it
git push -u origin update-readme   # send the branch to GitHub
```

## Merge it on GitHub {#merge-on-github}

On GitHub, click "Compare & pull request" on the yellow banner. Read your changes under "Files changed", click "Merge pull request", then "Confirm merge", and delete the branch when offered.

The merge happened on GitHub, so your computer doesn't have it yet. Bring it down:

```bash
git switch main               # back to main
git pull                      # bring down the merge from GitHub
git branch -d update-readme   # GitHub deleted its copy, this deletes yours
```

> [!TIP] Check it worked
> `git log --oneline` shows `Merge pull request #1` at the top, and `ls` shows `README.md`.

## Recap {#recap}

You can now:

- Check a project for secrets before it goes online
- Push a real project to GitHub
- Fix the common push errors
- Merge a pull request on your own repository

```bash
git remote add origin <url>            # connect to GitHub
git remote set-url origin <url>        # change the remote URL
git push -u origin main                # first push, and pair
```

That's the course! Two extra lessons follow. One covers `git reset` and rescuing lost commits, and the other covers checking before you pull.
