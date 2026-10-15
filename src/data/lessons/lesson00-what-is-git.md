---
id: 0
title: What is Git?
description: Understand what Git records and when you make a commit
unlocks: []
---

## The problem Git solves {#the-problem}

An app worked an hour ago. After a few edits, it won't even start.

Which change broke it? Undo only goes back so far, and it's hard to remember every edit.

**Git** is a program that keeps a record of your project over time. With it, you can see what changed and go back to a version that worked.

## Save points for code {#save-points}

Think of save points in a video game. Before a hard level, you save. If it goes badly, you load that save and try again, instead of starting the whole game over.

Git gives your project save points. Each one is called a **commit**.

A commit records a snapshot of the project contents you've chosen to save, plus a short note saying what changed. That note is the **commit message**.

## Your project's history {#history}

Over time, your commits line up into a history, newest at the top:

```text
Add a search box
Fix the delete button
First working version
```

If "Add a search box" breaks something, Git can show you which lines that commit changed. The earlier version is still recorded, so you can compare it with the new one and work out what needs fixing.

## Saving and committing {#you-choose-when}

Git doesn't record every keystroke. It only makes a commit when you tell it to.

Saving a file updates its contents on your computer. It doesn't create a commit. You choose when to record a save point.

So you commit at moments worth coming back to, like when a feature works or you've just fixed a bug.

```quiz
id: quiz-saving-vs-committing
question: A new file was saved five times today, but it was never staged or committed. How many of those versions did Git record?
options:
  - text: None of those versions
  - text: Five, one for every time you saved
    whyWrong: Saving changes the file, but it doesn't make a commit. Only commits are save points.
  - text: Just the last one you saved
    whyWrong: The latest version is in your working file, but you haven't asked Git to record it.
  - text: All of them, while the file stays open
    whyWrong: Git doesn't know which files your editor has open. Only commits are save points.
correctIndex: 0
explanation: A save point only exists once you commit. Saving the file isn't enough.
```

## Choose changes to commit {#you-choose-what}

You choose which changes go into each commit. If three files have edits but only one change is finished, you can commit that file's changes and leave the others for later.

Some files should stay out of your project history, such as files containing passwords. You'll see how to keep a file out when you make your first commit.

```quiz
id: quiz-choose-files
question: "`app.py` has a finished change, but the edits in `notes.txt` are only half done. What can your next commit hold?"
options:
  - text: Only the `app.py` changes
  - text: Both files, because a commit takes every change
    whyWrong: You choose which changes to commit. The others stay uncommitted.
  - text: Nothing, until both files are finished
    whyWrong: You can commit the finished change while the other stays uncommitted.
correctIndex: 0
explanation: You decide what goes into each commit, so the half-done file can wait.
```

## Recap {#recap}

You can now:

- Say what problem Git solves
- Explain what a commit is
- Tell saving a file apart from making a commit
- Say who decides what goes into a commit

Next up: the terminal, where you'll type Git's commands.
