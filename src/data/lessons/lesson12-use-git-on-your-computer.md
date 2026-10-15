---
id: 12
title: Use Git on your computer
description: Publish the course project files, make a change, and merge a pull request on GitHub
unlocks: []
---

## Download the project files {#download}

Git and GitHub CLI are set up. [Download todo-app.zip](/downloads/todo-app.zip) and extract it wherever you want to keep the project.

The archive contains the project files as they look at the end of the practice lessons. It has no Git history, so you'll make a new initial commit.

Extract the download wherever you like. Open your terminal and use `cd` to go into the extracted folder. If its path contains spaces, put the path in quotes. Run `ls` to check that it lists `app.py` and `README.md`.

## Make the initial commit {#initial-commit}

Initialise the project folder, then check which files Git sees:

```bash
git init
git status
```

Now stage all the files and inspect the staged list and contents, then commit:

```bash
git add .
git status
git diff --staged
git commit -m "feat: add Ticklist"
git status
```

The final status should say `nothing to commit, working tree clean`. This is one initial commit containing the downloaded project, ready to send to GitHub.

## Publish the project {#publish}

Create a private GitHub repository for the project. `--private` limits access to you and people you invite:

```bash
gh repo create todo-app --private
```

The command prints the repository's address. Add it as `origin` (replace `your-username` below with your GitHub username), then push the initial commit.

```bash
git remote add origin https://github.com/your-username/todo-app.git
git remote -v
git push -u origin main
git status
```

Now open the GitHub address. It should show the downloaded files and the initial commit. Next, you'll make a separate change and send it through a pull request.

## Edit on a branch {#make-a-change}

Create a branch before editing so the initial version stays on `main`:

```bash
git switch -c improve-readme
```

Open `README.md` in your code editor. If you don't have one, use Nano, which you set up in the previous lesson:

```bash
nano README.md
```

Add this line at the end, after `Add your tasks to tasks.txt, one per line.`, then save the file. In Nano, press Ctrl+O, Enter, then Ctrl+X:

```markdown
The examples cover due dates, priorities, search, exports, and reminders.
```

The README edit is in the working directory. It hasn't been staged or committed yet.

## Review and commit the edit {#commit-change}

Check the file and its changed line with `git status` and `git diff`. Then stage the README and review what the commit will contain:

```bash
git status
git diff
git add README.md
git status
git diff --staged
```

Only the added README line should appear in the staged diff. Commit it on `improve-readme`:

```bash
git commit -m "docs: describe the project examples"
```

The new commit is on the feature branch. `main` still points to the initial commit.

## Open the pull request {#open-pull-request}

Push the feature branch to GitHub, then open a pull request with `gh`. `--base main` selects `main` as the branch that will receive the change:

```bash
git push -u origin improve-readme
gh pr create --base main --title "docs: describe the project examples" --body "Describes the examples included in the project."
```

The command prints the pull request's URL. To open it in your browser, run:

```bash
gh pr view --web
```

The `--web` flag opens the pull request on GitHub, where you'll review and merge it next.

## Review and merge on GitHub {#review-and-merge}

This is your own practice repository, so you'll inspect the change yourself before merging. In a team, another person reviews it, as Sam did in the practice lessons.

On the pull request page, open Files changed. Check that `README.md` contains only the line you intended to add.

Return to Conversation. Choose Create a merge commit from the merge options, then select Merge pull request and Confirm merge.

GitHub now includes the README change in `main`. Your computer's `main` still has the initial version, so return to the terminal to bring in the merge.

## Pull the merged change {#pull-merged-change}

Switch back to local `main` and pull the commits merged on GitHub:

```bash
git switch main
git pull
git status
git log --oneline -2
```

The pull should report a fast-forward: local `main` had no separate new commits, so Git moved it forward to the merge you made on GitHub.

The status should show a clean working tree, up to date with `origin/main`. The log should include the merge and README commits. Open `README.md` again to check that the added line is now on local `main` too.

## Recap {#recap}

You can now:

- Publish a project's initial commit
- Make and review changes on a branch
- Create a pull request with GitHub CLI
- Review and merge a pull request on GitHub
- Pull the merged work into local `main`

```bash
git push -u origin <branch>   # publish and pair a branch
gh pr create --base main     # propose a merge into main
gh pr view --web             # open the request on GitHub
git switch main              # return to local main
git pull                     # bring in the merged change
```
