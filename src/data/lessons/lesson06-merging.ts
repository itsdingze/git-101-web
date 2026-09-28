import type { Lesson } from '@/types'
export default {
  id: 6,
  title: 'Merging',
  description: 'Combine branches together',
  unlocks: ['merge'],
  steps: [
    {
      type: 'reading',
      id: 'merge-basics',
      title: 'What merging is',
      content: [
        {
          type: 'text',
          value:
            '**Merging** is how you take the work sitting on one branch and fold it into another branch. When the work on a branch is finished, you merge it into `main` so it joins the main line of the project.',
        },
        {
          type: 'text',
          value:
            'Merging has a direction, and getting the direction backwards is the single most common beginner mistake. You first switch to the branch that is going to **receive** the work. Then you name the branch whose work you want to bring in.',
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
            'Commit or discard whatever you are in the middle of before you merge. Git may refuse to start if you have uncommitted edits that the incoming work would overwrite, and a clean starting point makes the result far easier to read.',
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
          type: 'code',
          language: 'text',
          value:
            'Updating 4aa5b69..512bbb8\nFast-forward\n navbar.html | 12 ++++++++++++\n 1 file changed, 12 insertions(+)\n create mode 100644 navbar.html',
        },
        {
          type: 'text',
          value:
            'A **merge commit** appears instead when `main` moved on while you worked, maybe because a teammate merged their own branch, or because you committed a quick fix to `main` yourself. Now there are two lines of history that both need to survive, so Git creates one extra commit whose only job is to join them.',
        },
        {
          type: 'code',
          language: 'text',
          value:
            "Merge made by the 'ort' strategy.\n footer.html | 3 +++\n 1 file changed, 3 insertions(+)\n create mode 100644 footer.html",
        },
        {
          type: 'text',
          value:
            'Ort is the internal name of the algorithm Git uses to combine the two sides. You can ignore it.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Where the merge message comes from',
          value:
            'A merge commit needs a message, and Git writes a sensible one for you: `Merge branch \'fix-footer\' into main`. Where a text editor is configured, Git opens it with that message already filled in so you can add to it, and the merge finishes as soon as you save and close. In Vim that is `Esc`, then `:wq`, then `Enter`. Adding `--no-edit`, as in `git merge --no-edit fix-footer`, accepts the default message and skips the editor entirely.',
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
        'You are already standing on `main`. Build the command that brings the work from the `feature` branch into it:',
      availableBlocks: ['git', 'merge', 'checkout', 'feature', 'main', 'branch', '-b'],
      correctAnswer: ['git', 'merge', 'feature'],
      hints: [
        'You only need three blocks',
        'You are already on the receiving branch, so name the other branch, the one whose work you want',
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
      id: 'merge-both-shapes',
      title: 'Two merges, two shapes',
      mode: 'guided',
      brief:
        'Below is a project with two finished branches waiting to come home. `add-navbar` holds the navbar work, and you are standing on it. `fix-footer` holds a footer that was written earlier, and `main` gained a typo fix after that branch split off. You are going to merge both, one after the other, and watch Git produce a different shape each time. Read the output after every merge. That is where the whole lesson is. Run `git branch` or `git log --oneline --graph` at any point to see where you are.',
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
          { run: 'git switch -c fix-footer' },
          { write: { 'footer.html': '<footer>\n  <p>&copy; 2026 Me</p>\n</footer>\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Add footer"' },
          { run: 'git switch main' },
          { write: { 'index.html': '<h1>Hello</h1>\n<a href="/about">About</a>\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Fix broken link in header"' },
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
        ],
      },
      goals: [
        {
          id: 'on-main',
          label: 'You are standing on `main`, the branch that receives the work',
          narration:
            'The navbar is finished and committed, and you are standing on `add-navbar`. A merge always runs from the branch that receives the work, so move onto `main` before you do anything else.',
          check: { kind: 'on-branch', name: 'main' },
          hints: [
            'A merge runs from the branch that receives the work, not the one that supplies it',
            'It is `git switch main`',
          ],
        },
        {
          id: 'navbar-merged',
          label: '`navbar.html` is on `main`',
          narration:
            'Now name the branch whose work you want. `main` has not moved since `add-navbar` split off it, so keep an eye out for the word `Fast-forward` in the output.',
          check: { kind: 'commit-exists', containing: ['navbar.html'], onBranch: 'main' },
          hints: [
            'Name the branch you want to bring in, not the one you are standing on',
            'It is `git merge add-navbar`',
          ],
        },
        {
          id: 'footer-merged',
          label: '`footer.html` is on `main`, joined by a merge commit',
          narration:
            'Git said `Fast-forward`. It slid the `main` label along to your navbar commit and the history stayed a straight line. `fix-footer` is a different story. It split off earlier, and `main` gained the `Fix broken link in header` commit after that, so both sides have moved since. Merge it and read what Git says this time.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'commit-exists', containing: ['footer.html'], onBranch: 'main' },
              { kind: 'merge-commit-exists', onBranch: 'main' },
            ],
          },
          hints: [
            'Same command, different branch name',
            'It is `git merge fix-footer`',
          ],
        },
        {
          id: 'branches-tidied',
          label: 'Neither `add-navbar` nor `fix-footer` is left in your branch list',
          narration:
            '`Merge made by the \'ort\' strategy.` means Git wrote an extra commit whose job is to join the two lines together. Run `git log --oneline --graph` to see them fork apart and come back. Then delete both branch names, because everything they were holding is on `main` now.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'branch-absent', name: 'add-navbar' },
              { kind: 'branch-absent', name: 'fix-footer' },
            ],
          },
          hints: [
            'The command lives under `git branch`, with the cautious delete flag',
            'It is `git branch -d add-navbar`, then `git branch -d fix-footer`',
          ],
        },
      ],
      completionMessage:
        'Two merges, two shapes, and you did not have to ask for either one. `add-navbar` fast-forwarded because `main` had stood still. `fix-footer` needed a merge commit because both sides had moved. The shape only reports what the branches did while you were away. `main` now holds the navbar, the footer and the typo fix, and your branch list is back down to one line.',
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
            'Recognise the message Git writes for a merge commit, and accept it with `--no-edit`',
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
