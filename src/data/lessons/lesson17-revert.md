---
id: 17
title: Revert
description: Undo a commit safely, even after you've shared it
unlocks: [ revert ]
---

## Undo a shared commit {#revert-commit}

Your export pull request was merged, and `main` has moved on. Your next idea is dark mode. It's one small file and you're in a hurry, so you skip the branch and the review, and push it straight to `main`:

```bash
~/todo-app (main) $ echo "THEME = dark" > theme.txt
~/todo-app (main) $ git add theme.txt
~/todo-app (main) $ git commit -m "feat: add dark mode"
[main 8149161] feat: add dark mode
 1 file changed, 1 insertion(+)
 create mode 100644 theme.txt
~/todo-app (main) $ git push
```

Sam and Priya pull it, and now the app breaks for everyone. Amending won't help. Amend replaces a commit, and your teammates already have the old one.

**Reverting** undoes a commit by adding a new commit that does the exact opposite. The original stays in your history, with the undo on top:

```bash
~/todo-app (main) $ git revert HEAD    # undo the newest commit
[main 53e9b3b] Revert "feat: add dark mode"
 1 file changed, 1 deletion(-)
 delete mode 100644 theme.txt          # dark mode added theme.txt, so the undo deletes it
~/todo-app (main) $ git log --oneline -3
53e9b3b (HEAD -> main) Revert "feat: add dark mode"   # the undo, on top
8149161 (origin/main) feat: add dark mode             # the original, still there
86b372b feat: add export
```

`HEAD` is Git's "you are here" marker, so `git revert HEAD` undoes the commit you're on, the newest one on your branch.

> [!TIP] Safe on shared branches
> Revert only adds a commit and never changes old ones, so it's safe on a branch other people use.

> [!WARNING] If a text editor opens
> On your own computer, `git revert` opens a text editor with the message already filled in. Saving and closing it finishes the revert. In Vim that's Esc, then `:wq`, then Enter.

## Share the undo {#push-the-revert}

A revert is a commit like any other, so it stays on your computer until you push it. In the log above, `origin/main` is still on the dark mode commit. `git push` sends the undo to the remote:

```bash
~/todo-app (main) $ git push
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), done.
To https://github.com/study-group/todo-app.git
   8149161..53e9b3b  main -> main      # the remote now has the undo
```

Your teammates get the fix the next time they pull.

## Undo an older commit {#revert-older}

The commit that broke things isn't always the newest. Say it had been export, one commit further back. `git revert` takes its hash in place of `HEAD`, and `git log --oneline` shows that hash:

```bash
~/todo-app (main) $ git log --oneline -3
8149161 (HEAD -> main, origin/main) feat: add dark mode
86b372b feat: add export                  # the commit to undo
45f4d46 feat: add priorities
~/todo-app (main) $ git revert 86b372b
[main 1aca720] Revert "feat: add export"
 1 file changed, 1 deletion(-)
 delete mode 100644 export.txt
~/todo-app (main) $ git log --oneline -3
1aca720 (HEAD -> main) Revert "feat: add export"
8149161 (origin/main) feat: add dark mode   # dark mode is untouched
86b372b feat: add export
```

Only that one commit's changes are undone. Everything committed after it stays.

## Amend or revert? {#amend-or-revert}

Amend replaces a commit, and revert adds one. So pick by whether anyone else has the commit:

- Only on your computer? Amend it, or fix it with a new commit.
- Already pushed? Revert it, so nobody's history breaks.

```sandbox-exercise
id: revert-a-bad-commit
title: "Practice: undo a commit by adding one"
mode: guided
brief: "Your export pull request is merged, and your clone is up to date. You'll push a new feature, dark mode, find out it breaks the app for everyone, and undo it. The remote here is simulated."
seed:
  dir: todo-app
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    setup:
      - story: team-after-team-workflow
  setup:
    - run: git config pull.rebase false
goals:
  - id: dark-mode-pushed
    label: Dark mode is committed and pushed
    narration: >-
      Write dark mode with `echo "THEME = dark" > theme.txt`. Stage it, commit it with `git commit -m "feat: add dark mode"`, and push it.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          messageIncludes: add dark mode
          containing: [ theme.txt ]
        - kind: pushed
          branch: main
    hints:
      - Write the file, stage it, commit it, then push.
      - >-
        Run `echo "THEME = dark" > theme.txt`, then `git add theme.txt`.
      - >-
        Then run `git commit -m "feat: add dark mode"` and `git push`.
  - id: dark-mode-reverted
    label: "`theme.txt` is gone, undone by a new commit on top of the original"
    narration: Sam and Priya pulled dark mode, and it broke the app. Undo the commit by adding one, then run `git log --oneline -3`.
    check:
      kind: all-of
      checks:
        - kind: file-absent
          path: theme.txt
        - kind: file-present
          path: export.txt
        - kind: commit-exists
          messageIncludes: 'Revert "feat: add dark mode"'
    hints:
      - Undo the commit itself, so the history explains what happened.
      - The command that undoes by adding is `git revert`, and it needs a commit.
      - Run `git revert HEAD`, since `HEAD` is the newest commit.
  - id: undo-pushed
    label: The undo is on the remote, where your team can pull it
    narration: The undo is only on your computer so far. Send it to the remote.
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          messageIncludes: 'Revert "feat: add dark mode"'
        - kind: pushed
          branch: main
    hints:
      - A revert is a commit, and commits reach the remote with a push.
      - Run `git push`.
detours:
  - id: reverted-wrong-commit
    check:
      kind: file-absent
      path: export.txt
    message: That undid a different commit, so export is gone. Run `git revert HEAD` to undo your revert, then revert the dark mode commit by its hash.
completionMessage: Dark mode is gone, the history shows both the commit and its undo, and your team has the fix. That's how you undo work other people already have.
```

```quiz
id: quiz-amend-or-revert
question: You pushed a commit with a bug, and your teammates already pulled it. How do you undo it?
options:
  - text: "`git revert` it, adding an undo commit"
  - text: "`git commit --amend` to replace it"
    whyWrong: Amending a shared commit makes your history stop matching theirs.
  - text: Delete the file and commit as if nothing happened
    whyWrong: The buggy commit stays, and nobody can tell what you undid.
  - text: "`git restore` the files it changed"
    whyWrong: Restore works on uncommitted changes, not on commits.
correctIndex: 0
explanation: Revert adds a commit on top, so everyone's history still lines up.
```

## Recap {#recap}

You can now:

- Undo a commit by adding its opposite
- Push the undo so your team gets it
- Find a commit's hash in the log
- Choose between amend and revert

```bash
git revert HEAD     # undo the newest commit
git revert <hash>   # undo an older commit
git push            # share the undo
```

Next up: setting Git up on your own computer.
