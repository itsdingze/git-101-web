---
id: 0
title: What Is Git
description: Why Git exists, and what a commit is
unlocks: []
---

## The problem Git solves {#the-problem}

Your app worked an hour ago. Since then you've changed a few files, and now it won't even start. Which change broke it? You can't remember, and undo only goes back so far.

Git fixes this. It keeps a record of your project over time, so you can always see what changed and go back to a version that worked.

## Save points for your code {#save-points}

Think of save points in a video game. Before a hard level, you save. If it goes badly, you load that save and try again, instead of starting the whole game over.

Git gives your project save points. Each one is called a **commit**. A commit is a snapshot of every file in your project at that moment, plus a short note saying what changed. That note is the **commit message**.

Over time, your commits line up into a history, newest at the top:

```text
Add a search box
Fix the delete button
First working version
```

If "Add a search box" breaks something, Git can show you exactly which lines it changed, or take you back to "Fix the delete button", the last version that worked.

## You choose when to commit {#you-choose}

Git doesn't watch every keystroke. It only takes a snapshot when you tell it to, by making a commit.

> [!INFO] Saving a file isn't a commit
> Saving in your editor only updates the file on your computer. Git records nothing until you commit.

So you commit at moments worth coming back to, like a feature that works or a bug you just fixed. The more often you commit, the more save points you have to go back to.

```quiz
id: quiz-saving-vs-committing
question: You saved `app.txt` five times today but never made a commit. How many of today's versions can Git take you back to?
options:
  - text: None, because Git only keeps commits
  - text: Five, one for every time you saved
    whyWrong: Saving changes the file, but Git doesn't keep a copy. Only commits become save points.
  - text: Just the last one you saved
    whyWrong: That's only the file as it is right now. Git has no copy of it, so if you break it, Git can't bring it back.
  - text: All of them, as long as the file is still open
    whyWrong: Git doesn't know which files your editor has open. It only keeps what you commit.
correctIndex: 0
explanation: A save point only exists once you commit. Saving the file isn't enough.
```

## A safety net for AI coding {#ai-safety-net}

AI coding tools can rewrite ten files in seconds. That's great when it works, and scary when it doesn't.

Commit before you let an AI tool change your project. Afterwards, Git shows you every line it changed. If you don't like the result, you go back to your last commit and nothing is lost.

## Git isn't GitHub {#git-vs-github}

People mix these two up all the time.

- **Git** is a program on your computer. It keeps your history inside your project folder, and works without the internet.
- **GitHub** is a website. You can send a copy of your history there to back it up, share it, or work on another computer.

Nothing goes online until you choose to send it. You'll use Git on its own for most of this course, and connect it to GitHub near the end.

```quiz
id: quiz-git-vs-github
question: You're on a plane with no internet. Can you still make commits?
options:
  - text: Yes, Git runs on your own computer
  - text: No, commits are stored on GitHub
    whyWrong: Commits live in your project folder. GitHub only has a copy if you send one.
  - text: Only if you're signed in to GitHub
    whyWrong: Commits don't need GitHub at all. Signing in only matters when you send your history there.
  - text: Yes, but they're lost once you reconnect
    whyWrong: Commits stay on your computer until you delete them. Going online changes nothing.
correctIndex: 0
explanation: Git keeps everything on your computer. You only need the internet to share your history on GitHub.
```

## Recap {#recap}

You can now:

- Say what problem Git solves
- Explain what a commit is
- Tell saving a file apart from making a commit
- Tell Git apart from GitHub

Next up: the terminal, and why you'll type Git commands instead of clicking buttons.
