import type { Lesson } from '@/types'
export default {
  id: 7,
  title: 'Merging',
  description: 'Combine branches together',
  steps: [
    {
      type: 'reading',
      id: 'merge-basics',
      title: 'What merging is',
      content: [
        {
          type: 'text',
          value:
            '**Merging** is how you take the work sitting on one branch and fold it into another branch. When your feature branch is finished, you merge it into `main` so the finished work joins the main line of the project.',
        },
        {
          type: 'text',
          value:
            'Merging has a direction, and getting the direction backwards is the single most common beginner mistake. You first switch to the branch that is going to **receive** the work. Then you name the branch you want to pull in.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Step 1: stand on the branch that should RECEIVE the work\ngit switch main\n\n# Step 2: name the branch whose work you want\ngit merge add-navbar',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Which branch do I run this from?',
          value:
            'Run `git merge` from the branch you want to end up holding the changes. Typing `git merge add-navbar` while standing on `main` means "main, take add-navbar\'s work". The branch you name is only read from. Git does not change it at all.',
        },
        {
          type: 'text',
          value:
            'If the two branches touched different files, or different parts of the same file, Git works it out on its own and you never have to think about it. If both branches changed the same lines, Git stops and asks you to decide which version wins. That is a **merge conflict**, and it gets a whole lesson to itself next.',
        },
        {
          type: 'callout',
          variant: 'tip',
          value:
            'Commit or discard whatever you are in the middle of before you merge. Git may refuse to start if you have unsaved edits that the incoming work would overwrite, and a clean starting point makes the result far easier to read.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'merging',
    },
    {
      type: 'reading',
      id: 'merge-types',
      title: 'Fast-forward vs. merge commit',
      content: [
        {
          type: 'text',
          value:
            'A merge can finish in two different shapes. Git looks at what happened on both branches and picks one by default, and both outcomes are normal.',
        },
        {
          type: 'text',
          value:
            'You get a **fast-forward** when nobody else touched `main` while you worked. `main` is still sitting exactly where it was on the day you branched off, and your branch already contains every commit `main` has, plus your new ones. There is nothing to reconcile, so Git slides the `main` label forward to your latest commit. Your history stays a straight line.',
        },
        {
          type: 'text',
          value:
            'A **merge commit** appears instead when `main` moved on while you worked, maybe because a teammate merged their own branch, or because you pushed a quick fix to `main` yourself. Now there are two lines of history that both need to survive, so Git creates one extra commit whose only job is to join them. Its message reads something like `Merge branch \'add-navbar\'`, and Git reports `Merge made by the \'ort\' strategy.` The word "ort" is the internal name of the algorithm Git uses to combine the two sides — you can ignore it.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A merge commit opens your text editor',
          value:
            'Before Git writes the merge commit it opens your editor with the message already filled in, something like `Merge branch \'add-navbar\'`. Keep it: save and close the editor and the merge finishes. In Vim that is `Esc`, then type `:wq`, then `Enter`. Running `git merge --no-edit add-navbar` accepts that message without opening the editor at all.',
        },
        {
          type: 'text',
          value:
            'You can override which shape you get: `--no-ff` forces a merge commit even when a fast-forward was possible, and `--ff-only` refuses to merge unless it can fast-forward. You need neither while you are learning. Some teams turn `--no-ff` on so every feature shows up as one join in the history. That is why a merge you make on a shared project may come out as a merge commit even when your branch was the only one that moved.',
        },
        {
          type: 'text',
          value:
            'You will see both within your first week on any shared project. Neither one means you did something right or wrong. The shape only describes what the branches did while you were away.',
        },
        {
          type: 'text',
          value:
            'This is also what `git config --global pull.rebase false` chose for you back in lesson 4. That setting was answering the divergent branches error, and `false` tells `git pull` to combine the two sides with a merge, producing exactly the merge commit described above.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-merge-types',
      question:
        'You branched `add-navbar` off `main`, made two commits, and nobody touched `main` the whole time. You switch back to `main` and run `git merge add-navbar`. What does Git do?',
      options: [
        {
          text: 'Creates an extra merge commit that joins the two branches together',
          whyWrong:
            'By default a merge commit only appears when both branches gained new commits after they split. Nothing new landed on `main`, so there is no second line of history to tie together.',
        },
        {
          text: 'Copies your files onto `main`, but your commits stay behind on `add-navbar`',
          whyWrong:
            'A merge brings the commits themselves, with their messages and their history intact. It is not a copy-paste of file contents.',
        },
        { text: 'Slides `main` forward to your latest commit (a fast-forward)' },
        {
          text: 'Refuses to merge until you delete `add-navbar` first',
          whyWrong:
            'Deleting a branch happens after a merge, and only if you want it to. Git never asks you to remove a branch before merging it.',
        },
      ],
      correctIndex: 2,
      explanation:
        '`main` never moved, so your branch already holds everything `main` has plus your own commits. There is nothing to reconcile, so Git can move the `main` label forward to your last commit and the history stays a single straight line.',
    },
    {
      type: 'block-exercise',
      id: 'build-merge',
      prompt:
        'You are already standing on `main`. Build the command that pulls the work from the `feature` branch into it:',
      availableBlocks: ['git', 'merge', 'checkout', 'feature', 'main', 'branch', '-b'],
      correctAnswer: ['git', 'merge', 'feature'],
      hints: [
        'You only need three blocks',
        'You are already on the receiving branch, so name the other branch, the one whose work you want',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'merge-branch',
      prompt:
        'This is the first of the two situations from the reading. Your project has one commit on `main`, and `add-navbar` adds one more: a twelve-line `navbar.html`. Nobody has touched `main` since you branched off, so this merge fast-forwards. You are standing on `main` now. Merge `add-navbar` into it:',
      expectedCommand: 'git merge add-navbar',
      acceptableVariants: [],
      successOutput:
        'Updating 7f3a9c1..7f3c2a1\nFast-forward\n navbar.html | 12 ++++++++++++\n 1 file changed, 12 insertions(+)\n create mode 100644 navbar.html',
      hints: [
        'The command is `git merge` followed by the name of the branch you want to pull in',
        'You are already on the receiving branch, so you do not name `main` anywhere',
      ],
    },
    {
      type: 'reading',
      id: 'after-merge',
      title: 'After the merge',
      content: [
        {
          type: 'text',
          value:
            '`main` now contains everything that was on `add-navbar`. The branch name has nothing left to do, so you can clear it away and keep your branch list short enough to read.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git log --oneline --graph  # see the history, merge and all\ngit branch -d add-navbar   # delete a branch you have already merged',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Deleting the branch does not delete your work',
          value:
            'The commits live in `main` now. A branch name is only a label pointing at a commit. Take the label away and the commits stay exactly where they are.',
        },
        {
          type: 'text',
          value:
            '`-d` is deliberately cautious. It refuses to delete a branch whose commits have not been merged anywhere. If Git blocks the delete, take that seriously. It is telling you that real work is about to become hard to find.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'merge-loop-practice',
      title: 'Practice: the whole merge loop',
      mode: 'goal',
      brief:
        'Below is a project with two branches, and you are standing on `add-navbar`, where the navbar work is finished and committed. Meanwhile a teammate added a commit called `Fix broken link in header` to `main`, so both branches have moved on since they split. That is why this one produces a merge commit instead of a fast-forward. **Your goal: get the navbar onto `main`, then leave your branch list tidy.** Run `git log --oneline --graph` when you are done to see the shape of what you built, and `git branch` at any point to see where you are.',
      seed: {
        dir: 'my-project',
        setup: [
          { run: 'git init' },
          {
            write: {
              'index.html': '<h1>Hello</h1>\n<a href="/abuot">About</a>\n',
              'style.css': 'body { font-family: sans-serif; }\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          { run: 'git switch -c add-navbar' },
          {
            write: {
              'navbar.html': [
                '<nav class="site-nav">',
                '  <ul>',
                '    <li><a href="/">Home</a></li>',
                '    <li><a href="/about">About</a></li>',
                '    <li><a href="/work">Work</a></li>',
                '    <li><a href="/blog">Blog</a></li>',
                '    <li><a href="/contact">Contact</a></li>',
                '  </ul>',
                '  <button class="menu-toggle" type="button">',
                '    Menu',
                '  </button>',
                '</nav>',
                '',
              ].join('\n'),
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Add navbar"' },
          { run: 'git switch main' },
          { write: { 'index.html': '<h1>Hello</h1>\n<a href="/about">About</a>\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Fix broken link in header"' },
          { run: 'git switch add-navbar' },
        ],
      },
      goals: [
        {
          id: 'on-main',
          label: 'You are standing on `main`, the branch that receives the work',
          check: { kind: 'on-branch', name: 'main' },
          hints: [
            'A merge always runs from the branch that receives the work',
            'Use `git switch` followed by the name of the branch you want to stand on',
          ],
        },
        {
          id: 'merged',
          label: '`navbar.html` is on `main`, joined by a merge commit',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'commit-exists', containing: ['navbar.html'], onBranch: 'main' },
              { kind: 'merge-commit-exists', onBranch: 'main' },
            ],
          },
          hints: [
            'Name the branch you want to pull in, not the one you are standing on',
            'The command is `git merge add-navbar`',
          ],
        },
        {
          id: 'branch-deleted',
          label: 'The `add-navbar` branch name is gone',
          check: { kind: 'branch-absent', name: 'add-navbar' },
          hints: [
            'The command lives under `git branch`, with the cautious delete flag',
            'The command is `git branch -d add-navbar`. Try it before the merge too, and read what Git says.',
          ],
        },
      ],
      completionMessage:
        'That is the entire merge loop: switch to the receiving branch, merge, look at what happened, then delete the branch you no longer need. In `git log --oneline --graph` the two lines split apart and then come back together, and that fork is your merge.',
    },
    {
      type: 'quiz',
      id: 'quiz-wrong-direction',
      question:
        'Your navbar work is finished on `add-navbar`. Without switching branches, you run `git merge main`, and Git reports that it succeeded. What actually happened?',
      options: [
        {
          text: '`add-navbar` was merged into `main`, the same result as running it from `main`',
          whyWrong:
            'The two directions are not the same. The branch you are standing on receives the work, and the branch you name is only read from.',
        },
        {
          text: "`add-navbar` picked up main's latest commits. `main` itself is untouched, so your navbar still is not on `main`.",
        },
        {
          text: 'Nothing happened, because Git blocks a merge run from the wrong branch',
          whyWrong:
            'Git has no way of knowing which direction you meant, so it did exactly what you typed. The command succeeding is what makes this mistake so easy to miss.',
        },
        {
          text: '`add-navbar` was deleted once the merge finished',
          whyWrong:
            'Merging never removes a branch. You delete it yourself with `git branch -d`, whenever you decide you are done with it.',
        },
      ],
      correctIndex: 1,
      explanation:
        '`git merge` always pours the branch you name into the branch you are currently standing on. Standing on `add-navbar` means `add-navbar` is the branch that changed. To get the navbar onto `main`, run `git switch main` first, then `git merge add-navbar`.',
    },
    {
      type: 'reading',
      id: 'recap',
      title: 'Recap',
      content: [
        { type: 'text', value: 'You can now:' },
        {
          type: 'list',
          items: [
            'Merge one branch into another, starting from the branch that should receive the work',
            'Tell a fast-forward from a merge commit, and let Git pick between them while you are learning',
            'Save and close the editor Git opens for a merge commit, or skip it with `--no-edit`',
            'Read your history as a graph and spot where a merge joined two lines together',
            'Delete a branch once it is merged, knowing the commits stay safe in `main`',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch main            # stand on the branch that receives the work\ngit merge add-navbar       # fold that branch into the one you are on\ngit log --oneline --graph  # see the history, merge and all\ngit branch -d add-navbar   # delete a branch you have already merged',
        },
        {
          type: 'text',
          value:
            'Next up: what to do when Git cannot work the merge out on its own. You will learn to read a merge conflict, fix it calmly, and finish the merge.',
        },
      ],
    },
  ],
} satisfies Lesson
