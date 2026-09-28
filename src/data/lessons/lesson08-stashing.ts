import type { Lesson } from '@/types'
export default {
  id: 8,
  title: 'Stashing',
  description: 'Temporarily shelve changes for later',
  unlocks: ['stash'],
  steps: [
    {
      type: 'reading',
      id: 'when-to-stash',
      title: 'When to use stash',
      content: [
        {
          type: 'text',
          value:
            'You are halfway through something. Half the dessert chapter of *Sunday Kitchen*, the cookbook you are writing, is rewritten, none of it reads right yet, and the printer emails asking for an urgent correction on another branch. You do not want to commit this mess. You definitely do not want to lose it.',
        },
        {
          type: 'text',
          value:
            'You may have heard that Git blocks you from switching branches while you have uncommitted edits. Most of the time it does not. Git usually carries your uncommitted edits across to the other branch and lets you carry on. It refuses only in one case: when the switch would have to overwrite one of your edited files because that file looks different on the branch you are moving to.',
        },
        {
          type: 'text',
          value:
            'The carrying-across is the real nuisance. Your half-finished dessert edits follow you onto the other branch, sit there while you work, clutter up `git status`, and can get swept into the correction commit by an absent-minded `git add .`.',
        },
        {
          type: 'text',
          value:
            '**Stashing** means putting your uncommitted changes on a shelf inside your project and rewinding your files back to how they looked at your last commit. Nothing is deleted. Later you take the work back off the shelf.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash        # Put your changes on the shelf, leaving a clean working folder\ngit stash pop    # Take the newest changes back off the shelf',
        },
      ],
    },
    {
      type: 'reading',
      id: 'tracked-vs-untracked',
      title: 'What stash takes, and what it leaves',
      content: [
        {
          type: 'text',
          value:
            '`git stash` shelves your **tracked** changes. That means anything Git already has in a commit, plus any brand-new file you have staged with `git add`. A staged new file does get shelved, and it disappears from your folder until you bring it back.',
        },
        {
          type: 'text',
          value:
            'What stays behind is the file Git has never been told about, created but never added. That one sits exactly where it is while everything around it rewinds. Here is what that looks like. `desserts.md` is tracked and has uncommitted edits. `pavlova.md` is brand new and has never been added.',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ git stash\nSaved working directory and index state WIP on main: 5a8fc40 Initial commit\n\n$ git status\nOn branch main\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tpavlova.md\n\nnothing added to commit but untracked files present (use "git add" to track)',
        },
        {
          type: 'text',
          value:
            'The edits to `desserts.md` are gone from the folder and safe on the shelf. `pavlova.md` has not moved at all, and the working folder is not clean after all.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Use -u when you have brand-new files',
          value:
            'Add the `-u` flag and Git takes the untracked files too, so `git stash -u` really does leave you with an empty-looking folder. The `u` is short for *untracked*. This catches people out both ways: they stash, assume everything is shelved, and then find a new file still sitting there, or they use `-u` and wonder where their new file went. Run `git status` after either one and you will always know which happened.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'stash-or-wip-commit',
      title: 'Stash, or a scratch commit?',
      content: [
        {
          type: 'text',
          value:
            'Stash is not the only way out of this, and for someone new to Git it is often not the best one. The alternative is a scratch commit: commit the half-finished work with a throwaway message, switch away, deal with the urgent thing, switch back, and keep going.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git add .\ngit commit -m "WIP: dessert chapter"   # WIP = work in progress',
        },
        {
          type: 'text',
          value:
            'A commit is loud. It shows up in `git log`, it makes `git status` clean, and it survives anything you do next. A stash is quiet. Nothing on screen tells you it exists.',
        },
        {
          type: 'text',
          value:
            'So reach for stash when you specifically do not want that half-finished state recorded in your project\'s history at all. If you do not care, a scratch commit is the simpler and safer habit.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Forgotten stashes are a real problem',
          value:
            'A week later `git status` still says everything is clean, and there is no hint that work is sitting on the shelf. The only way to find out is to run `git stash list`. Stashes are also local: they belong to your computer, not to any branch, and they do not travel with the project. Get in the habit of checking `git stash list` before you assume a branch is finished.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'stash-commands',
      title: 'Managing your stashes',
      content: [
        {
          type: 'text',
          value:
            'You can shelve more than once. Git keeps the stashes in a list, newest first. `stash@{0}` is the most recent one, `stash@{1}` the one before it.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash list      # Show everything you have on the shelf\ngit stash apply     # Bring the newest one back, leave it on the shelf\ngit stash pop       # Bring it back and take it off the shelf\ngit stash drop      # Throw the newest one away without bringing it back',
        },
        {
          type: 'text',
          value:
            '`pop` is `apply` plus removing the entry. Use `apply` when you want the shelved copy to stay put as a backup until you are sure the restored work is fine. A `pop` prints the state of your folder afterwards, then the line confirming the entry is gone:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ git stash pop\nOn branch main\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   desserts.md\n\nno changes added to commit (use "git add" and/or "git commit -a")\nDropped refs/stash@{0} (6dc4898d670c2fb5205555346f9f4fe10e7b2dd3)',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Name your stashes',
          value:
            'Left to itself, Git labels a stash with the message of your last commit, which tells you nothing about what is inside it. Add your own note with `git stash push -m "half-rewritten dessert chapter"`, and `git stash list` starts reading like something a human wrote.',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '$ git stash list\nstash@{0}: On main: half-rewritten dessert chapter',
        },
        {
          type: 'text',
          value:
            'One detail worth expecting: changes come back as unstaged edits, even the ones you had staged before you shelved them. Run `git add` again before you commit.',
        },
        {
          type: 'text',
          value:
            'If `git stash pop` lands on top of edits that clash with the shelved ones, you get a merge conflict, with the same markers in the file and the same job of choosing what the final version says. When that happens, Git keeps the stash entry instead of dropping it, so your shelved copy is still safe while you sort the conflict out.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-stash',
      prompt: 'Build the command to put your current changes on the shelf:',
      availableBlocks: ['git', 'stash', 'push', 'pop', 'save', 'add', 'commit'],
      correctAnswer: ['git', 'stash'],
      acceptableAnswers: [['git', 'stash', 'push']],
      hints: [
        'You only need two blocks',
        'The shortest form of the command is git stash',
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'stash-round-trip',
      title: 'Practice: shelve it, fix it, take it back',
      mode: 'guided',
      brief:
        'Below is `cookbook`, the manuscript of *Sunday Kitchen*, on `main`, with one commit holding `intro.md`, `desserts.md`, and `title-page.md`. You are mid-rewrite: `desserts.md` has uncommitted edits, and `pavlova.md` is brand new and has never been added. Then the printer emails. The title page still says the old edition year, and the book goes to press tonight. Run `git status` and `ls` freely as you go, because watching the folder change is the whole point of this one.',
      seed: {
        dir: 'cookbook',
        setup: [
          { run: 'git init' },
          {
            write: {
              'intro.md': '# Sunday Kitchen\n\nThirty recipes from a very small kitchen.\n',
              'desserts.md': '# Desserts\n\n## Lemon tart\n',
              'title-page.md': 'Sunday Kitchen, second edition 2025\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          {
            write: {
              'desserts.md':
                '# Desserts\n\n## Lemon tart\n\n## Burnt basque cheesecake\n\nStill working out the oven temperature.\n',
              'pavlova.md': '# Pavlova\n\nWhisk six egg whites until stiff.\n',
            },
          },
        ],
      },
      goals: [
        {
          id: 'shelved',
          label: 'Your changes are on the shelf',
          narration:
            'Run `git status` first and read what it says: `desserts.md` is modified, and `pavlova.md` is untracked. Now put your work on the shelf with the plain, one-word form of the stash command.',
          check: { kind: 'stash-count', count: 1 },
          hints: [
            'Two words. No flags, no file names.',
            'Run `git stash`.',
          ],
        },
        {
          id: 'untracked-shelved',
          label: '`pavlova.md` is on the shelf too, and the folder is clean',
          narration:
            'Run `git status` and `ls` before you do anything else. The `desserts.md` edits are gone, but `pavlova.md` is still sitting there, because Git has never been told about it. Stash again, this time with the flag that takes untracked files as well.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'file-absent', path: 'pavlova.md' },
              { kind: 'working-tree-clean' },
            ],
          },
          hints: [
            'The flag is one letter, and it stands for untracked.',
            'Run `git stash -u`. Then `ls` to watch `pavlova.md` disappear.',
          ],
        },
        {
          id: 'fix-committed',
          label: 'The title page correction is committed',
          narration:
            'The folder is clean now, so nothing half-finished can be swept into what you do next. Fix the year by rewriting `title-page.md` with `echo "Sunday Kitchen, second edition 2026" > title-page.md`, then commit that one change.',
          check: { kind: 'commit-count', count: 2 },
          hints: [
            'Stage the edit, then commit it with a message.',
            '`git add title-page.md` then `git commit -m "Fix the year on the title page"`.',
            'Or do both at once: `git commit -am "Fix the year on the title page"`.',
          ],
        },
        {
          id: 'restored',
          label: 'The shelf is empty and the dessert work is committed',
          narration:
            'The correction is in, so go and get your work back. There are two entries on the shelf, so `git stash list` first, then pop twice. Newest comes back first, which is `pavlova.md`. Then stage everything and commit the dessert work.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'stash-empty' },
              { kind: 'commit-exists', containing: ['pavlova.md'] },
            ],
          },
          hints: [
            'Each `pop` brings back one entry and removes it from the list.',
            'Run `git stash pop` twice, checking `git status` between them.',
            'Then `git add .` and `git commit -m "Add the pavlova recipe"`.',
          ],
        },
      ],
      completionMessage:
        'That is the everyday stash loop, and you saw the part people learn the hard way: plain `git stash` left `pavlova.md` sitting in the folder, and only `-u` took it. Run `git log --oneline` and `git stash list` below to confirm where everything ended up.',
    },
    {
      type: 'quiz',
      id: 'quiz-pop-vs-apply',
      question:
        'You ran `git stash pop`. The restored work is not what you expected, and you want to bin these edits and start again from the shelved copy, but `git stash list` is now empty. Which command should you have run instead of `pop`, and why?',
      options: [
        {
          text: 'Neither, since `pop` is a shorter name for `apply` and the list would be empty either way',
          whyWrong:
            'They restore the same changes, but they differ in what happens afterwards: `pop` deletes the stash entry, `apply` leaves it on the shelf. That is exactly the difference you needed here.',
        },
        {
          text: '`git stash apply`, which restores the same changes but leaves the shelved copy in the list, so you could throw the mess away and apply it again',
        },
        {
          text: '`git stash push`, which brings the changes back without emptying the shelf',
          whyWrong:
            'Putting changes onto the shelf is `git stash` (or `git stash push`). Both `pop` and `apply` take changes back off it.',
        },
        {
          text: '`git stash apply stash@{1}`, because `apply` reaches older stashes and the newest one would have stayed put',
          whyWrong:
            'Both act on the newest stash by default, and either one can reach an older one when you name it, for example `git stash pop stash@{2}`. Naming an entry is not what keeps it on the shelf.',
        },
      ],
      correctIndex: 1,
      explanation:
        'The stash is a shelf, and the only question is whether the item stays on it. `pop` hands the work back and clears the entry, so the moment the restored work disappoints you there is nothing left in the list to go back to. `apply` hands the work back and keeps the shelved copy, which is the safety net you want whenever you are not yet sure the restored changes are right. Once they look good, `git stash drop` clears the entry.',
    },
    {
      type: 'quiz',
      id: 'quiz-urgent-correction',
      question:
        'You are halfway through a rewrite on branch `rewrite-desserts` with uncommitted edits. An urgent correction on `main` has to go out right now, and you do not want the half-finished chapter showing up in your project history. What do you run first?',
      options: [
        {
          text: 'git add . to put the edits aside, then git switch main',
          whyWrong:
            'Staging sets nothing aside. Staged edits come across to `main` exactly like unstaged ones, and they are already lined up to go into the very next commit you make there.',
        },
        {
          text: 'git commit -m "WIP", then git switch main',
          whyWrong:
            'This is a perfectly good habit in general, and often the safer one. But it records the half-finished chapter in your branch history, which this question rules out.',
        },
        {
          text: 'git stash',
        },
        {
          text: 'git switch main straight away, because Git carries the edits across for you',
          whyWrong:
            'It usually does carry them across, and that is the problem: your half-finished chapter edits end up sitting on `main` while you make the correction, where a quick `git add .` can sweep them into that commit.',
        },
      ],
      correctIndex: 2,
      explanation:
        '`git stash` shelves the dessert work and leaves you a clean working folder, so you switch to `main` with nothing of the rewrite tagging along and nothing recorded in history. Make the correction, switch back to `rewrite-desserts`, and `git stash pop` puts the half-finished work back exactly as you left it.',
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
            'Shelve half-finished work with `git stash` and take it back with `git stash pop`',
            'Say which files plain `git stash` leaves behind, and include them with `git stash -u`',
            'See what is on the shelf with `git stash list`, and label a stash so that list means something later',
            'Choose between `pop` and `apply` depending on whether you want a safety net',
            'Choose between a stash and a scratch WIP commit, and say why you picked it',
            'Explain why Git usually lets you switch branches with uncommitted edits, and why that is not always what you want',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash                  # Shelve your changes (tracked files only)\ngit stash -u               # Shelve brand-new untracked files too\ngit stash push -m "note"   # Shelve with a note about what is inside\ngit stash list             # Show everything on the shelf\ngit stash pop              # Bring the newest one back and remove it\ngit stash apply            # Bring it back but keep it on the shelf\ngit stash drop             # Throw the newest one away',
        },
        {
          type: 'text',
          value:
            'Next up: fixing mistakes. You will unstage a file, throw away an edit, fix the commit you just made, undo an older one without erasing it, and get back work you thought was gone for good.',
        },
      ],
    },
  ],
} satisfies Lesson
