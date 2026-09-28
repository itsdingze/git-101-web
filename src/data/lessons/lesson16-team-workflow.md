---
id: 16
title: Team Workflow
description: Branches, pull requests, and keeping a shared main working
unlocks: []
---

## The team loop {#feature-branch-workflow}

Three of you now build `todo-app`, and everyone builds on top of `main`, so it has to keep working. That's why each change gets its own branch, and a teammate checks it before it reaches `main`:

1. Switch to `main` and pull everyone's latest work.
2. Create a branch named for the job, like `add-export`.
3. Commit your changes on that branch.
4. Push the branch, and open a **pull request** on GitHub: a request for your teammates to review the branch and merge it into `main`.
5. A teammate reviews it, and it's merged into `main`.

Your next job is export, so the app can save a list to a file. Steps 1 to 4 happen in your terminal:

```bash
git switch main                    # 1. start from main
git pull                           # 1. get everyone's latest work
git switch -c add-export           # 2. a new branch for this one job
echo "export(tasks)" > export.txt  # 3. write the feature
git add export.txt                 # 3. stage it
git commit -m "feat: add export"   # 3. commit it on the branch
git push -u origin add-export      # 4. send the branch up, and pair it
```

That first `git pull` brings down a commit from Sam, who added priorities while you were away.

> [!INFO] Working alone?
> Committing straight to `main` is fine on your own projects. The branch rule is for when other people depend on `main`.

## Pull requests {#pr-workflow}

You open a pull request on GitHub with a button. It shows your changes line by line, so teammates can comment and ask for fixes before anything is merged.

The name comes from asking the project's owners to pull your changes into `main`. Once they agree, one click on GitHub merges the branch.

> [!TIP] Keep pull requests small
> A 40-line pull request gets a careful read. A 4,000-line one gets skimmed and approved.

## Stay up to date {#stay-current}

Teammates keep merging into `main` while you work on your branch. `git pull origin main` brings their work into your branch, so the two don't drift apart. Say Sam's priorities had reached `main` after you made your branch, not before:

```bash
~/todo-app (add-export) $ git pull origin main   # bring the remote's main into this branch
From https://github.com/study-group/todo-app
 * branch            main       -> FETCH_HEAD    # Git's bookkeeping, safe to skip
   f8be44c..45f4d46  main       -> origin/main   # main has a new commit
Merge made by the 'ort' strategy.                # merged into add-export
 priority.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 priority.txt
```

Why name `origin main`? Once you've pushed your branch with `-u`, it's paired with `add-export` on the remote, so plain `git pull` only brings down that branch. Naming `origin main` says which branch to bring in.

Git merges it into yours with a merge commit, the same as `git merge` does. If a teammate changed the same lines as you, the merge stops on a conflict, and you settle it like any other merge conflict.

## After the merge {#after-the-merge}

Once your pull request is merged, the work is on the remote's `main`, and your branch has done its job. Three commands finish the loop on your computer:

```bash
git switch main               # back to main
git pull                      # bring down the merged work
git branch -d add-export      # delete the branch you no longer need
```

That leaves you on an up-to-date `main`, ready to start the next branch.

```sandbox-exercise
id: feature-branch-workflow-practice
title: "Practice: the team loop, start to finish"
mode: goal
brief: "You, Sam, and Priya build `todo-app` together, and your copy is behind what Sam pushed. Walk the team loop for your next feature, export. Write it with `echo \"export(tasks)\" > export.txt`, and end with a pushed branch called `add-export` that a teammate could review. The remote here is simulated."
seed:
  dir: todo-app
  remote:
    name: origin
    url: https://github.com/study-group/todo-app.git
    setup:
      - story: team-after-push-and-pull
    ahead:
      - write:
          priority.txt: |
            PRIORITIES = low, high
      - run: git add .
      - run: 'git commit -m "feat: add priorities"'
  setup:
    - run: git config pull.rebase false
goals:
  - id: up-to-date
    label: You have the commit your teammates pushed
    check:
      kind: any-of
      checks:
        - kind: commit-exists
          messageIncludes: add priorities
          onBranch: main
        - kind: commit-exists
          messageIncludes: add priorities
          onBranch: add-export
    hints:
      - The loop starts on `main`, with everyone's latest work pulled down.
      - Run `git pull`, then `git log --oneline` to see what arrived.
  - id: on-feature-branch
    label: You're on a new branch called `add-export`
    check:
      kind: all-of
      checks:
        - kind: branch-exists
          name: add-export
        - kind: on-branch
          name: add-export
    hints:
      - The command that moves you between branches can create one first.
      - Run `git switch -c add-export`.
  - id: committed
    label: The export is committed on that branch, along with your teammates' latest work
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ export.txt ]
          onBranch: add-export
        - kind: commit-exists
          messageIncludes: add priorities
          onBranch: add-export
    hints:
      - Write the feature on the branch, stage it, then commit it.
      - >-
        Run `echo "export(tasks)" > export.txt`, then `git add export.txt`.
      - >-
        Then run `git commit -m "feat: add export"`.
  - id: pushed
    label: The branch is on the remote, where a teammate can review it
    check:
      kind: all-of
      checks:
        - kind: pushed
          branch: add-export
        - kind: upstream-set
          branch: add-export
        - kind: commit-exists
          messageIncludes: add priorities
          onBranch: add-export
    hints:
      - A branch's first push needs `-u`, the remote, and the branch name.
      - Run `git push -u origin add-export`.
detours:
  - id: committed-on-main
    check:
      kind: commit-exists
      containing: [ export.txt ]
      onBranch: main
    message: The export commit landed on `main`, so nobody gets to review it. Press **Start over**, and create `add-export` before you commit.
  - id: stale-branch
    check:
      kind: all-of
      checks:
        - kind: commit-exists
          containing: [ export.txt ]
          onBranch: add-export
        - kind: not
          check:
            kind: commit-exists
            messageIncludes: add priorities
            onBranch: add-export
    message: Your branch started from an old `main`, so it's missing your teammates' work. While on `add-export`, run `git pull origin main`, then push again.
completionMessage: You pulled, branched, committed, and pushed, which is a normal working day on a team. The pull request itself happens on GitHub.
```

```quiz
id: quiz-feature-branch-start
question: Your team asks you to add sorting. You last worked on the project two weeks ago. What's your first move?
options:
  - text: Switch to `main`, pull, then create a branch
  - text: Commit the change straight to `main`
    whyWrong: Work on a shared `main` should go through a branch and a review.
  - text: Create the branch now, and pull later
    whyWrong: Your branch would start from a two-week-old `main`.
  - text: Clone the whole project again into a new folder
    whyWrong: A branch keeps the work separate inside the folder you already have.
correctIndex: 0
explanation: Pulling first means your branch starts from the `main` your teammates have now.
```

## Recap {#recap}

You can now:

- Start new work on a branch from the latest `main`
- Push a branch so a teammate can review it
- Explain what a pull request is for
- Keep your branch up to date with `main`
- Tidy up once your pull request is merged

```bash
git switch main                 # start from main
git pull                        # get the latest work
git switch -c add-export        # branch for one job
git push -u origin add-export   # send it up for review
git pull origin main            # bring main into your branch
git branch -d add-export        # delete it once merged
```

Next up: undoing a commit your team already has.
