import type { Lesson } from '@/types'
export default {
  id: 9,
  title: 'Stashing',
  description: 'Temporarily shelve changes for later',
  steps: [
    {
      type: 'reading',
      id: 'when-to-stash',
      title: 'When to use stash',
      content: [
        {
          type: 'text',
          value:
            'You are halfway through something. Half the navbar is restyled, nothing works yet, and an urgent bug lands on another branch. You do not want to commit this mess. You definitely do not want to lose it.',
        },
        {
          type: 'text',
          value:
            'You may have heard that Git blocks you from switching branches while you have uncommitted edits. Most of the time it does not. Git usually carries your uncommitted edits across to the other branch and lets you carry on. It refuses only in one case: when the switch would have to overwrite one of your edited files because that file looks different on the branch you are moving to.',
        },
        {
          type: 'text',
          value:
            'The carrying-across is the real nuisance. Your half-finished navbar edits follow you onto the bug-fix branch, sit there while you work, clutter up `git status`, and can get swept into the bug-fix commit by an absent-minded `git add .`.',
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
        {
          type: 'callout',
          variant: 'warning',
          title: 'Stash can leave brand-new files behind',
          value:
            '`git stash` shelves your **tracked** changes: anything Git already has in a commit, plus any brand-new file you have staged with `git add`. A staged new file does get shelved, and it disappears from your folder until you bring it back. What stays behind is the file Git has never been told about — created but never added. That one sits exactly where it is while everything around it rewinds, which surprises people. Use `git stash -u` to shelve those too (`-u` is short for *untracked*).',
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
            'Stash is not the only way out of this, and for someone new to Git it is often not the best one. The alternative is a scratch commit: commit the half-finished work with a throwaway message, switch away, fix the bug, switch back, and keep going.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git add .\ngit commit -m "WIP: navbar styling"   # WIP = work in progress',
        },
        {
          type: 'text',
          value:
            'A commit is loud. It shows up in `git log`, it makes `git status` clean, and it survives anything you do next. A stash is quiet — nothing on screen tells you it exists.',
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
            'A week later `git status` still says everything is clean, and there is no hint that work is sitting on the shelf. The only way to find out is to run `git stash list`. Stashes are also local: they belong to your computer, not to any branch, and `git push` does not send them anywhere. Clone the project onto another machine and your stashes are not there. Get in the habit of checking `git stash list` before you assume a branch is finished.',
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
            '`pop` is `apply` plus removing the entry. Use `apply` when you want the shelved copy to stay put as a backup until you are sure the restored work is fine.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Name your stashes',
          value:
            'Left to itself, Git labels a stash with the message of your last commit, which tells you nothing about what is inside it. Add your own note with `git stash push -m "half-finished navbar styling"`, and `git stash list` starts reading like something a human wrote.',
        },
        {
          type: 'text',
          value:
            'One detail worth expecting: changes come back as unstaged edits, even the ones you had staged before you shelved them. Run `git add` again before you commit.',
        },
        {
          type: 'text',
          value:
            'If `git stash pop` lands on top of edits that clash with the shelved ones, you get a merge conflict. Resolve it exactly the way you learned in the previous lesson. When that happens, Git keeps the stash entry instead of dropping it, so your shelved copy is still safe while you sort the conflict out.',
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
      type: 'terminal-exercise',
      id: 'stash-pop',
      prompt:
        'You are on `main`. Earlier you shelved an unfinished edit to `style.css`. Bring it back and take it off the shelf:',
      expectedCommand: 'git stash pop',
      acceptableVariants: [],
      successOutput:
        'On branch main\nChanges not staged for commit:\n  modified:   style.css\n\nDropped refs/stash@{0} (5e4a5354cc008e7c3afc9e9446dd0fe4d741cc82)',
      hints: [
        'Use git stash with a subcommand that restores and removes',
        'pop = apply + drop',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-pop-vs-apply',
      question:
        'You ran `git stash pop`. The restored code is not what you expected, and you want to bin these edits and start again from the shelved copy, but `git stash list` is now empty. Which command should you have run instead of `pop`, and why?',
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
        'The stash is a shelf, and the only question is whether the item stays on it. `pop` hands the work back and clears the entry, so the moment the restored code disappoints you there is nothing left in the list to go back to. `apply` hands the work back and keeps the shelved copy, which is the safety net you want whenever you are not yet sure the restored changes are right. Once they look good, `git stash drop` clears the entry.',
    },
    {
      type: 'quiz',
      id: 'quiz-urgent-bug',
      question:
        'You are halfway through a feature on branch `feature-navbar` with uncommitted edits. An urgent bug on `main` needs fixing right now, and you do not want the half-finished navbar showing up in your project history. What do you run first?',
      options: [
        {
          text: 'git checkout . to clear the edits, then git switch main',
          whyWrong:
            'That throws your uncommitted work away for good. Git has never seen those edits, so there is no copy of them anywhere to recover.',
        },
        {
          text: 'git commit -m "WIP", then git switch main',
          whyWrong:
            'This is a perfectly good habit in general, and often the safer one. But it records the half-finished navbar in your branch history, which this question rules out.',
        },
        {
          text: 'git stash',
        },
        {
          text: 'git switch main straight away, because Git carries the edits across for you',
          whyWrong:
            'It usually does carry them across, and that is the problem: your half-finished navbar edits end up sitting on `main` while you fix the bug, where a quick `git add .` can sweep them into the bug-fix commit.',
        },
      ],
      correctIndex: 2,
      explanation:
        '`git stash` shelves the navbar work and leaves you a clean working folder, so you switch to `main` with nothing of the feature tagging along and nothing recorded in history. Fix the bug, switch back to `feature-navbar`, and `git stash pop` puts the half-finished work back exactly as you left it.',
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
            'Include brand-new files that Git has never seen, using `git stash -u`',
            'See what is on the shelf with `git stash list`, and label a stash so that list means something later',
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
            'Next up: common Git problems. You will meet the everyday mistakes (wrong commit message, committed the wrong file, deleted work you needed) and the exact command that gets you out of each one.',
        },
      ],
    },
  ],
} satisfies Lesson
