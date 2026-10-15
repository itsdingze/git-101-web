---
id: 8
title: Put your project on GitHub
description: Push your commits to GitHub and clone your project onto another computer
unlocks: [gh, remote, push, clone]
---

## Keep a copy on GitHub {#why-a-remote}

So far, your project's history is stored only on one computer. Keeping a copy elsewhere protects the commits you send there and lets teammates work with you.

**GitHub** is a website that hosts Git repositories. A **remote** is another repository your local repository can exchange commits with. Here, the remote is `todo-app` on the practice GitHub.

We've prepared an empty `todo-app` repository on the practice GitHub. You'll sign in, send the project's commits there, and then practise copying the repository onto another computer.

## Sign in with a token {#sign-in}

**GitHub CLI**, called `gh`, is a program for working with GitHub through commands. CLI stands for command-line interface. The practice terminal simulates the `gh` commands used here.

To sign in to the simulated account, use the provided practice **token**. A real token is a secret code that grants access.

This token is only for the practice. When you set up your own computer later, you'll sign in through your browser.

We've placed a practice token in `~/token.txt`. `--with-token` tells `gh auth login` to read a token, and `<` passes the file's contents to the command.

After signing in, run `gh auth status` to check the username:

```terminal
~/projects/todo-app (main) $ gh auth login --with-token < ~/token.txt
~/projects/todo-app (main) $ gh auth status
github.com
  ✓ Logged in to github.com account your-username (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: ghp_************************************
  - Token scopes: 'gist', 'read:org', 'repo'
~/projects/todo-app (main) $
```

> [!DANGER] Keep real tokens private
> Anyone with a token can use the access it grants. Never put a real token in a commit. If a real token is exposed, revoke it in GitHub and create a replacement.

## Connect your project {#remote-add}

`git remote add` adds a remote to your local repository and gives it a name. Here, the name is `origin`, and the address points to `todo-app` on GitHub.

Then run `git remote -v` to check the saved address. The `-v` flag means verbose, asking for more detail:

```terminal
~/projects/todo-app (main) $ git remote add origin https://github.com/your-username/todo-app.git
~/projects/todo-app (main) $ git remote -v
origin	https://github.com/your-username/todo-app.git (fetch)
origin	https://github.com/your-username/todo-app.git (push)
~/projects/todo-app (main) $
```

`origin` is the conventional name for the main remote. The `fetch` line names the address used to receive commits, and the `push` line names the address used to send them.


## Push your history {#push}

Sending commits to a remote is called **pushing**. In `git push -u origin main`, `origin` is the remote and `main` is the branch to send.

The `-u` flag also pairs local `main` with `main` on `origin`. Git calls the paired branch its **upstream**. After that, plain `git push` and `git pull` can use this pairing without naming the remote and branch again:

```terminal
~/projects/todo-app (main) $ git push -u origin main
Enumerating objects: 33, done.
Counting objects: 100% (33/33), done.
Writing objects: 100% (33/33), done.
To https://github.com/your-username/todo-app.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
~/projects/todo-app (main) $ git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
~/projects/todo-app (main) $
```

GitHub now has the commits from local `main`. `origin/main` is Git's local record of GitHub's `main`, updated by this push. The status check confirms that local `main` matches that record.

```block-exercise
id: build-push-u
prompt: "Build the command that sends `main` to `origin` for the first time and pairs them:"
availableBlocks: [ git, push, -u, origin, main, remote, add ]
correctAnswer: [ git, push, -u, origin, main ]
acceptableAnswers:
  - [ git, push, origin, main, -u ]
  - [ git, push, origin, -u, main ]
decoyReasons:
  remote: "`git remote` names addresses without sending anything."
  add: "`add` stages files and doesn't send anything to GitHub."
hints:
  - Start with `git push`, then the flag that pairs the branches.
  - After the flag, name the remote, then the branch.
  - The full command is `git push -u origin main`.
```

```quiz
id: quiz-commit-vs-push
question: You committed, and Git said `1 file changed`. Your GitHub page doesn't show the change. Why?
options:
  - text: You haven't pushed the commit
  - text: The commit failed without saying so
    whyWrong: "`1 file changed` means the commit worked on your computer."
  - text: GitHub takes a few minutes to update
    whyWrong: GitHub can't see your computer, so waiting won't help.
correctIndex: 0
explanation: A commit stays on your computer until `git push` sends it to GitHub.
```

```sandbox-exercise
id: push-to-github
title: "Practice: push to GitHub"
mode: guided
brief: "Your turn: your empty `todo-app` repository is waiting on the practice GitHub. Sign in with the token in `~/token.txt`, then connect your project and push it."
seed:
  dir: projects/todo-app
  remote:
    name: origin
    url: https://github.com/your-username/todo-app.git
    cloned: false
  setup:
    - story: home-files
    - story: after-read-your-history
    - write:
        ~/token.txt: |
          ghp_R8vK2mQ7xT4wL9nB3cY6dZ1hJ5pS0fGa2Uex
goals:
  - id: signed-in
    label: "`gh` is signed in to GitHub"
    narration: Sign `gh` in with the token in `~/token.txt`, then check with `gh auth status`.
    check:
      kind: all-of
      checks:
        - kind: gh-authenticated
        - { kind: last-command, startsWith: gh auth status }
    hints:
      - "`--with-token` tells `gh auth login` to expect a token, and `<` reads it from the file."
      - Run `gh auth login --with-token < ~/token.txt`, then `gh auth status`.
  - id: main-pushed
    label: "`main` is on GitHub, paired with `origin/main`"
    narration: Add the GitHub repository as a remote named `origin`. Push `main` with `-u` to pair it with `main` on that remote.
    check:
      kind: all-of
      checks:
        - { kind: pushed, branch: main }
        - { kind: upstream-set, branch: main }
    hints:
      - Add the remote first, then push the branch to it.
      - Run `git remote add origin https://github.com/your-username/todo-app.git`.
      - Then run `git push -u origin main`.
  - id: status-checked
    label: "`git status` says you're up to date with `origin/main`"
    narration: Run `git status` to compare `main` with the `origin/main` record updated by your push.
    check:
      kind: all-of
      checks:
        - { kind: up-to-date-with-remote, branch: main }
        - { kind: last-command, startsWith: git status }
    hints:
      - The command that compares your branch with `origin/main` is the one you use most.
      - Run `git status`.
detours:
  - id: pushed-without-upstream
    check:
      kind: all-of
      checks:
        - { kind: pushed, branch: main }
        - kind: not
          check: { kind: upstream-set, branch: main }
    message: Your commits reached GitHub, but without `-u` your `main` isn't paired with `origin/main`. Run `git push -u origin main` once to pair them.
completionMessage: GitHub has `main` and the commits in its history. Your local `main` is paired with `origin/main`.
```

## Work on another computer {#clone}

Imagine you're working on another computer and need a copy of `todo-app`. A **clone** copies the committed files and history from GitHub into a new local folder.

For this example, the practice terminal represents that computer. It starts in `projects`, with `gh` already signed in. Run `gh repo clone` with the GitHub username and repository name:

```terminal
~/projects $ gh repo clone your-username/todo-app
Cloning into 'todo-app'...  # the new folder's name
remote: Enumerating objects: 33, done.
remote: Counting objects: 100% (33/33), done.
remote: Compressing objects: 100% (6/6), done.
remote: Total 33 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (33/33), done.
~/projects $ cd todo-app
~/projects/todo-app (main) $ ls
app.py  dates.py  priority.py  README.md  search.py
~/projects/todo-app (main) $ git log --oneline -3
71779aa (HEAD -> main, origin/main) feat: sort tasks by due date
a75a159 feat: add priorities
6724512 Merge branch 'add-search'
~/projects/todo-app (main) $
```

The new `todo-app` folder contains the committed files, and the log confirms that their history came with them. `tasks.txt` and the local `debug.log` aren't copied because they're excluded from the latest commit. The log's older committed version still exists in the history.

## Check the remote after cloning {#clone-origin}

Cloning also adds the source repository as `origin` and pairs local `main` with `main` on that remote. Run `git remote -v` to check the address:

```terminal
~/projects/todo-app (main) $ git remote -v
origin	https://github.com/your-username/todo-app.git (fetch)
origin	https://github.com/your-username/todo-app.git (push)
~/projects/todo-app (main) $
```

`git clone` does the same job when you give it the address: `git clone https://github.com/your-username/todo-app.git`.

```quiz
id: quiz-clone-contents
question: You clone `todo-app` onto your laptop. What's in the new folder?
options:
  - text: Committed files and history from GitHub
  - text: The newest files only, with no history
    whyWrong: This clone brings the history from GitHub too. Use `git log` to inspect it.
  - text: Everything in your first computer's folder
    whyWrong: A clone only holds what was committed, so `tasks.txt` stays behind.
correctIndex: 0
explanation: The clone has the committed files and history from GitHub, with the source repository saved as `origin`.
```

```sandbox-exercise
id: clone-on-a-laptop
title: "Practice: clone the project"
mode: guided
brief: "Imagine you're on your laptop, in `projects`, with `gh` already signed in. Clone `todo-app`, enter its folder, and check that the history came too."
seed:
  dir: projects
  github: { signedIn: true }
  remote:
    name: origin
    url: https://github.com/your-username/todo-app.git
    cloned: false
    setup:
      - story: team-after-put-it-on-github
  setup:
    - story: home-files
goals:
  - id: cloned
    label: "A clone of `todo-app` is in `projects`"
    narration: Clone `your-username/todo-app` from GitHub with `gh`.
    check: { kind: clone-exists, path: projects/todo-app }
    hints:
      - "`gh repo clone` takes the owner and the repository's name, with a slash between."
      - Run `gh repo clone your-username/todo-app`.
  - id: in-the-clone
    label: "You're in the new `todo-app` folder"
    narration: Step into the folder the clone made.
    check: { kind: current-folder, path: projects/todo-app }
    hints:
      - Run `ls` to see the new folder's name.
      - Run `cd todo-app`.
  - id: history-seen
    label: You've seen the history that came with the clone
    narration: List the commits, one line each, to see that the history came along.
    check:
      kind: all-of
      checks:
        - { kind: current-folder, path: projects/todo-app }
        - { kind: last-command, startsWith: git log }
        - kind: not
          check: { kind: file-present, path: todo-app/todo-app/README.md }
    hints:
      - "`git log` lists commits, and one flag puts each on a single line."
      - Run `git log --oneline`.
detours:
  - id: clone-nested
    check: { kind: file-present, path: todo-app/todo-app/README.md }
    message: That clone landed inside the first `todo-app` folder, because a clone makes its folder wherever you are. Press Start over, and clone from `~/projects`.
completionMessage: Your laptop has the committed files and history from GitHub, with `origin` already set up.
```

## Recap {#recap}

You can now:

- Sign `gh` in to GitHub
- Connect a project to a remote
- Push a branch and pair it with `-u`
- Clone a repository onto another computer

```bash
gh auth login --with-token < <file>   # sign in with a token
gh auth status                        # check you're signed in
git remote add origin <url>           # name a remote origin
git remote -v                         # list remotes
git push -u origin main               # first push, and pair
git push                              # send new commits
gh repo clone <owner>/<repository>    # copy a repository here
git clone <url>                       # same, with an address
```

Next up: working on the app with a teammate.
