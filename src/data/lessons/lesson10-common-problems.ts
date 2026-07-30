import type { Lesson } from '@/types'
export default {
  id: 10,
  title: 'Common Git Problems',
  description: 'Fix mistakes, undo changes, and recover lost work',
  steps: [
    {
      type: 'reading',
      id: 'common-problems-intro',
      title: 'Everyone makes mistakes',
      content: [
        {
          type: 'text',
          value:
            'Staging the wrong file. A typo in a commit message. Committing something that was never meant to leave your laptop. Every person who uses Git does all of this, regularly. Git was built by people who expected it.',
        },
        {
          type: 'text',
          value:
            'This lesson is ordered from gentlest to most dangerous. The first commands are safe to run without thinking twice. Before you meet the ones that can destroy work, you will learn the command that gets your work back.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'restore-unstage',
      title: 'Unstaging and restoring files',
      visualization: 'restore-walkthrough',
      content: [
        {
          type: 'text',
          value:
            'You ran `git add` on a file you did not mean to include. It is now in the **staging area**, the packing table from lesson 2 where you lay out what goes into the next commit. You want this file out of the staging area without losing the edits you made.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Take a file out of the staging area, keep your edits:\ngit restore --staged notes.txt\n\n# Throw the edits away and go back to the last committed version:\ngit restore notes.txt',
        },
        {
          type: 'text',
          value:
            'Those two lines look almost identical and do very different things. The `--staged` flag is the entire difference between them.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'git restore without --staged throws work away',
          value:
            'Uncommitted edits were never recorded anywhere, so once `git restore notes.txt` overwrites them there is no command that brings them back, not even the reflog you meet later in this lesson. Read the line twice before you press Enter.',
        },
        {
          type: 'text',
          value:
            'If the file is staged **and** you want the edits gone completely, run both, in this order: `git restore --staged notes.txt` first, then `git restore notes.txt`. Without `--staged`, `git restore` copies whatever is currently in the staging area back into your folder. If the bad version is still staged, nothing seems to happen.',
        },
        {
          type: 'text',
          value:
            'Older tutorials use `git checkout -- notes.txt` to discard edits and `git reset HEAD notes.txt` to unstage. Those still work. `git restore` was added later because each of those older commands does several unrelated jobs, and people mixed them up constantly.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-restore-staged',
      prompt: 'Build the command to take "notes.txt" out of the staging area without losing your edits:',
      availableBlocks: ['git', 'restore', 'reset', '--staged', '--hard', 'notes.txt', 'HEAD'],
      correctAnswer: ['git', 'restore', '--staged', 'notes.txt'],
      acceptableAnswers: [['git', 'reset', 'HEAD', 'notes.txt']],
      hints: [
        'One flag is the whole difference between discarding your edits and taking the file out of the staging area',
        'Use git restore with the --staged flag, then name the file',
      ],
    },
    {
      type: 'reading',
      id: 'amend-commit',
      title: 'Fixing the last commit',
      content: [
        {
          type: 'text',
          value:
            'You committed, then half a second later spotted the typo in the message or realised you forgot to `git add` one file. You do not need a second commit that says "oops". You can replace the one you just made.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Rewrite the message of the commit you just made:\ngit commit --amend -m "Corrected commit message"\n\n# Add a file you forgot, keeping the same message:\ngit add forgotten-file.txt\ngit commit --amend --no-edit',
        },
        {
          type: 'text',
          value:
            '`--no-edit` means "keep the message exactly as it is". Without it, Git opens an editor so you can change the wording.',
        },
        {
          type: 'text',
          value:
            'Amending does not edit the old commit. It builds a **replacement** and points your branch at that instead. The replacement gets its own **commit hash**. That is the short string of letters and numbers like `7f3a9c1` that Git uses as the name of a commit. To Git, and to GitHub, it is a different commit that happens to look similar.',
        },
        {
          type: 'text',
          value:
            'That matters for exactly one reason: if the original was already pushed to a branch other people use, the copy on GitHub and yours no longer agree. There is a step near the end of this lesson about that situation.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'amend-message',
      prompt:
        'You have just committed a one-line fix to `README.md` on `main`, and you mistyped the message. Replace that message with "Fix typo in README":',
      expectedCommand: 'git commit --amend -m "Fix typo in README"',
      acceptableVariants: [
        "git commit --amend -m 'Fix typo in README'",
      ],
      successOutput:
        '[main e7f8a9b] Fix typo in README\n Date: Mon Jan 1 12:00:00 2024 +0000\n 1 file changed, 1 insertion(+), 1 deletion(-)',
      hints: [
        'The flag that replaces the last commit is --amend',
        'Use git commit --amend with -m and the new message in quotes',
      ],
    },
    {
      type: 'reading',
      id: 'revert-commit',
      title: 'Undoing a commit without erasing it',
      content: [
        {
          type: 'text',
          value:
            '`git revert` deletes nothing. It reads a commit, works out the exact opposite of what that commit did, and records that opposite as a **new** commit on top. The original stays in the history, and so does the undo.',
        },
        {
          type: 'text',
          value:
            'To use it you need a way to name a commit. **HEAD** is the "you are here" marker for the branch you are on, from lesson 6. Written as a name inside a command, it means the commit that marker is sitting on, the newest one on your current branch. `HEAD~1` means one commit before that, `HEAD~2` two before it, and so on. A commit hash like `7f3c2a1` works anywhere `HEAD` does.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Undo the most recent commit:\ngit revert HEAD\n\n# Undo one specific older commit, leaving newer ones alone:\ngit revert 7f3c2a1\n\n# Skip the editor and accept the suggested message:\ngit revert HEAD --no-edit',
        },
        {
          type: 'text',
          value:
            'Because revert only ever adds, it is safe on a branch other people are using. Your teammates pull one extra commit and can read exactly what was undone and when. Nothing they already have on their machine stops being true.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'revert-head',
      prompt:
        'Your last commit on `main`, "Add broken feature", added a three-line `broken-feature.js` that you now want gone. Undo it by adding a new commit that reverses it:',
      expectedCommand: 'git revert HEAD',
      acceptableVariants: ['git revert HEAD --no-edit'],
      successOutput:
        '[main b4c5d6e] Revert "Add broken feature"\n 1 file changed, 3 deletions(-)\n delete mode 100644 broken-feature.js',
      hints: [
        'The command that undoes by adding is git revert',
        'HEAD names the most recent commit',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-restore-vs-revert',
      question:
        'You edited `config.json` and staged it with `git add`, then decided the change was a bad idea. Nothing has been committed. You want the file back exactly as it was at your last commit, and you do not want to touch any other file. What do you run?',
      options: [
        {
          text: '`git revert HEAD`',
          whyWrong:
            '`git revert` undoes a whole commit. Your bad change was never committed, so `HEAD` is an earlier, perfectly good commit. This would undo the wrong thing entirely.',
        },
        {
          text: '`git reset --hard HEAD`',
          whyWrong:
            'This does get rid of the change, but it wipes every uncommitted edit in the whole project along with it. The question asked you to leave the other files alone.',
        },
        {
          text: '`git restore --staged config.json`, then `git restore config.json`',
        },
        {
          text: '`git restore --staged config.json` on its own',
          whyWrong:
            'That is the right first half. It takes the file out of the staging area, but your edited version is still sitting in the folder. You need a second `git restore` without `--staged` to put the old content back.',
        },
      ],
      correctIndex: 2,
      explanation:
        'The two commands work on the two places a change can be. `--staged` puts the staging area back to the version from your last commit, and the second `git restore` then copies that version into your folder. Order matters: without the first command, the second one copies the bad staged version back over itself.',
    },
    {
      type: 'reading',
      id: 'reflog-safety',
      title: 'Your safety net: git reflog',
      content: [
        {
          type: 'text',
          value:
            'Before you meet the command that can destroy commits, meet the one that gets them back.',
        },
        {
          type: 'text',
          value:
            'Every time your position moves (a commit, a branch switch, a merge, an undo), Git writes a line in a private log called the **reflog**, short for reference log. It is the list of every place `HEAD` has been on this machine, newest first.',
        },
        {
          type: 'code',
          language: 'bash',
          value: '# Show every place HEAD has been:\ngit reflog',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '9a8b7c6 HEAD@{0}: reset: moving to HEAD~1\nf4e5d6c HEAD@{1}: commit: Add new feature\n9a8b7c6 HEAD@{2}: commit: Fix bug',
        },
        {
          type: 'text',
          value:
            'Each line gives you a label like `HEAD@{1}` and the commit hash you were standing on at that moment. The top line is the reflog writing down the very mistake you are undoing: `reset: moving to HEAD~1` is the reset that moved you off `f4e5d6c`.',
        },
        {
          type: 'text',
          value:
            'Notice that `HEAD@{0}` and `HEAD@{2}` show the same hash. That is not a mistake. The reset put you back exactly where that older commit was, so both lines describe the same spot. The line you want is `HEAD@{1}`: `f4e5d6c`, the commit you moved off. To undo a mistake, find the line describing the moment just before it and use that hash.',
        },
        {
          type: 'text',
          value:
            '"Add new feature" is not gone. Make a branch at that commit so it is safe again:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git switch -c recovered f4e5d6c',
        },
        {
          type: 'text',
          value:
            'That is the same `git switch -c` you used in lesson 6 to start a branch, with a commit hash on the end saying where to start it. A branch called `recovered` now points at that commit. Git holds on to any commit a branch points at, and `git switch` has moved you onto the new branch. `git reset --hard f4e5d6c` gets you back to that commit too, and `git reset` is the next step in this lesson.',
        },
        {
          type: 'text',
          value:
            'This is why a "lost" commit is usually still there. If the commit was ever made on your computer, its hash is in the reflog, and a commit Git still holds can be brought back. Two limits worth knowing. The reflog lives only on your machine, so it says nothing about work done on anyone else\'s. And Git clears old entries out on a timer: an entry for a commit that nothing points at any more, which is exactly the kind you are rescuing here after a `reset` or an `--amend`, goes after about thirty days, while entries for commits a branch still holds last about ninety. Thirty days is the figure to count on. The reflog rescues recent mistakes. It is not an archive.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'reset-modes',
      title: 'git reset and its three modes',
      visualization: 'reset-walkthrough',
      content: [
        {
          type: 'text',
          value:
            'A branch is a pointer at one commit, the newest one on that branch. `git reset` moves that pointer backwards, so the commits after it are no longer part of the branch. What happens to the *code* from those commits depends on which of three modes you pick.',
        },
        {
          type: 'list',
          items: [
            '`--soft` moves the pointer back and touches nothing else. The changes from the undone commits are still in your staging area, ready to be committed again. Good for rewording or combining commits.',
            '`--mixed` is the default, what you get when you name no mode at all. It moves the pointer back and clears the staging area, but your files keep every change. You will need `git add` again before committing.',
            '`--hard` moves the pointer back and rewrites your files to match. It destroys the changes from those commits, along with any uncommitted edits lying around in your folder.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git reset --soft HEAD~1   # Undo the last commit, keep the changes staged\ngit reset HEAD~1          # Undo the last commit, keep the changes in your files\ngit reset --hard HEAD~1   # Undo the last commit and wipe the changes',
        },
        {
          type: 'text',
          value:
            '`--hard` is the only one of the three that destroys anything. If you run it and regret it, `git reflog` still has the hash of the commit you jumped away from. That is the rescue you just learned. Edits that were never in any commit have no hash, so those are the ones that really do disappear.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-reset-soft',
      prompt: 'Build the command to undo the last commit but keep your changes in the staging area:',
      availableBlocks: ['git', 'reset', 'restore', '--soft', '--hard', '--mixed', 'HEAD~1', 'HEAD'],
      correctAnswer: ['git', 'reset', '--soft', 'HEAD~1'],
      hints: [
        'One commit back is HEAD~1',
        'Of the three modes, --soft is the one that leaves your changes staged',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-reset-vs-revert',
      question:
        'You made a commit on your own branch two minutes ago and have not pushed it anywhere. The code in it is fine. You only want the commit itself gone, so you can fold those changes into a bigger commit later. What do you run?',
      options: [
        {
          text: '`git reset --hard HEAD~1`',
          whyWrong:
            'This undoes the commit and takes the code with it. `--hard` rewrites your files to match the older commit, so the work you wanted to keep is wiped.',
        },
        {
          text: '`git reset --soft HEAD~1`',
        },
        {
          text: '`git revert HEAD`',
          whyWrong:
            '`revert` keeps the commit and adds a second one that cancels it out. You would end up with two commits where you wanted none, and the changes would be undone rather than kept.',
        },
        {
          text: '`git commit --amend`',
          whyWrong:
            'Amend swaps the last commit for a different one. There would still be a commit sitting there, and you asked for none for now.',
        },
      ],
      correctIndex: 1,
      explanation:
        '`--soft` moves the branch pointer back one commit and leaves everything else exactly as it was, so the changes are sitting in the staging area ready to go into whatever commit you make next. Nothing was pushed, so rewriting this bit of history affects nobody but you.',
    },
    {
      type: 'quiz',
      id: 'quiz-wrong-branch',
      question:
        'You made three commits on `main` that were meant to go on a new branch called `add-search`. Nothing has been pushed. What gets the commits onto `add-search` and `main` back to where it started?',
      options: [
        {
          text: 'Run `git reset --hard HEAD~3` on `main` first, then create `add-search` and redo the work',
          whyWrong:
            'The reset happens while nothing is holding on to those three commits, so `main` drops them and the new branch starts from the older commit. You would be retyping work you had already finished.',
        },
        {
          text: 'Run `git switch -c add-search` and stop there',
          whyWrong:
            'This creates the branch and takes the three commits with it, which is half the job. But `main` is still pointing at them too, so the commits now sit on both branches and `main` is not back where it started.',
        },
        {
          text: 'Run `git revert` three times on `main`',
          whyWrong:
            'That leaves all three commits on `main` and adds three more that cancel them out: six commits of noise on the branch you wanted clean. And `add-search` still does not exist.',
        },
        {
          text: 'Run `git branch add-search` first, then `git reset --hard HEAD~3` on `main`',
        },
      ],
      correctIndex: 3,
      explanation:
        '`git branch add-search` drops a second pointer on the commit you are standing on, so all three commits now have a branch holding them. Only then is it safe to move `main` back three commits. The commits survive on `add-search`, and you switch to it to carry on. The order is the whole trick.',
    },
    {
      type: 'reading',
      id: 'when-safe-to-rewrite',
      title: 'When is it safe to rewrite history?',
      content: [
        {
          type: 'text',
          value:
            '`git commit --amend` and `git reset` both **rewrite history**: the commits that come out have different hashes from the ones that went in, so Git treats them as different commits. Whether that is harmless or a disaster comes down to one question: has anyone else seen the originals?',
        },
        {
          type: 'list',
          items: [
            '**Only on your machine: rewrite freely.** If the commits were never pushed, nobody else has a copy. Amend, reset, and reorder as much as you like.',
            '**Already pushed and shared: leave them alone.** Everyone who pulled has the old versions. Replacing them means their history and yours stop lining up, and sorting that out costs somebody else an afternoon.',
          ],
        },
        {
          type: 'text',
          value:
            'When you are not sure which case you are in, use `git revert`. It adds instead of replacing, so it is never the wrong answer on a shared branch.',
        },
        {
          type: 'text',
          value:
            'There is a middle case. You pushed a feature branch that only you work on, then amended a commit on it. Your next push is rejected, because the branch on GitHub no longer matches yours. The fix is not `--force`:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Refuses if anyone pushed to the branch since you last fetched:\ngit push --force-with-lease\n\n# Overwrites whatever is there, no questions asked:\ngit push --force',
        },
        {
          type: 'text',
          value:
            '`--force-with-lease` only overwrites the branch on GitHub if it still looks the way it did the last time you fetched it. If a teammate pushed something you have not seen, your push is rejected instead of quietly deleting their commits. It costs you nothing and it has saved a lot of people.',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'Never force-push a shared branch',
          value:
            'Neither `--force` nor `--force-with-lease` belongs on `main`, or on any branch your team works from. Force-pushing there rewrites history under everyone at once, and the next pull each of them runs turns into a mess you will spend the day untangling. Keep force-pushing to branches only you touch.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-undo-pushed',
      question:
        'You pushed a commit to the shared `main` branch that accidentally deleted an important config file. Your teammates pull from `main` several times a day. What is the safest way to undo it?',
      options: [
        {
          text: '`git revert HEAD`',
        },
        {
          text: '`git reset --hard HEAD~1`, then `git push --force`',
          whyWrong:
            'This rewrites history on a branch the whole team pulls from. Everyone who already pulled the bad commit now has a history that disagrees with GitHub, and the next person to push can quietly undo your fix.',
        },
        {
          text: '`git restore config.json`, then commit the file back',
          whyWrong:
            'Plain `git restore` reads from the staging area, and the deleted file is not there, so you get `error: pathspec \'config.json\' did not match any file(s) known to git`. To make this work you would have to name a commit to read the old content out of. `git revert` finds that content for you in one step.',
        },
        {
          text: '`git commit --amend` to put the file back into the bad commit',
          whyWrong:
            'Amend replaces a commit that is already on the shared branch, which is a history rewrite with a friendlier name. It causes the same trouble for your teammates that reset does.',
        },
      ],
      correctIndex: 0,
      explanation:
        '`git revert HEAD` writes a new commit that puts the deleted file back and leaves the bad commit in place as a record of what happened. Nobody has to do anything unusual. Their next `git pull` picks up the fix. Anything that rewrites `main` makes every teammate repair their own copy.',
    },
    {
      type: 'reading',
      id: 'clear-history',
      title: 'Starting fresh with a clean history',
      content: [
        {
          type: 'text',
          value:
            'Here is a situation that has nothing to do with mistakes in a single commit: the repository is yours alone, it has never been shared, and its history is a pile of experiments you would rather not publish. You want the files as they are today, with a single tidy commit behind them.',
        },
        {
          type: 'text',
          value:
            'The `.git` folder holds the entire memory of a repository. Delete it and your files stay exactly as they are. Only the history goes. Then you start a fresh repository in the same folder:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# macOS, Linux, or Git Bash on Windows:\nrm -rf .git\n\n# Windows PowerShell:\nRemove-Item -Recurse -Force .git\n\n# Then start over, with the files exactly as they are now:\ngit init\ngit add .\ngit commit -m "Initial commit"',
        },
        {
          type: 'text',
          value:
            '`rm -rf` is a macOS and Linux command, and PowerShell does not understand it. On Windows use the `Remove-Item` line, or run the first line inside Git Bash, which came with the Git installer back in lesson 1.',
        },
        {
          type: 'text',
          value:
            'This is not an undo. Every commit and every branch in that repository is gone, and the reflog goes with them, so there is nothing left to recover from. If the repository was ever pushed anywhere, the remote still holds the old history and your fresh local history will not line up with it. Keep this for a personal repository nobody else has touched.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'committed-a-secret',
      title: 'If you commit a password or an API key',
      content: [
        {
          type: 'text',
          value:
            'You put a password, an API key, or an access token in a file, committed it, and pushed. This happens to experienced engineers constantly. What you do in the next five minutes matters far more than anything you do to your Git history.',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'Rotate the secret now, before anything else',
          value:
            'Treat that value as already stolen, because you cannot prove otherwise. Change the password. Revoke the API key and issue a new one. Do that first, before you type a single Git command. Rotating is the fix. Everything after it is tidying up.',
        },
        {
          type: 'text',
          value:
            'Deleting the commit does not undo the leak. The value is sitting on the GitHub servers, and GitHub can still serve that commit by its hash after you take the commit off a branch. The secret is also in every copy anyone has made of the repository, and in the automated scanners that read public repositories within seconds of a push. Neither those copies nor those scanners find out that you changed your mind.',
        },
        {
          type: 'text',
          value:
            'Once the secret has been rotated, the old value is worthless and cleanup becomes optional. If you want it out of your history anyway, add the file to `.gitignore` so it stops coming back, then follow the GitHub guide on [removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). Rewriting published history is beyond this course, and rotation has already made you safe.',
        },
      ],
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
            'Take a file out of the staging area without losing your edits, and say why `--staged` is the whole difference',
            'Fix the message on the commit you just made, or slip in a file you forgot',
            'Undo a commit on a shared branch with `git revert`, which adds rather than erases',
            'Find a commit you thought you had destroyed in `git reflog` and bring it back by branching at its hash',
            'Choose between `--soft`, `--mixed`, and `--hard` on `git reset`, and name the one that destroys work',
            'Tell when rewriting history is harmless and when it becomes a problem for everyone else, and reach for `--force-with-lease` over `--force`',
            'Wipe the history of a personal repository by deleting its `.git` folder and starting again',
            'Keep that move for a repository nobody else has touched, because it is the one thing in this lesson with no undo at all',
            'Do the one thing that actually matters when a secret gets committed: rotate it',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git restore --staged file.txt   # Take a file out of the staging area\ngit restore file.txt            # Throw away uncommitted edits (no undo)\ngit commit --amend -m "msg"     # Replace the commit you just made\ngit commit --amend --no-edit    # Same, keeping the old message\ngit revert HEAD                 # Add a commit that undoes the last one\ngit reflog                      # Every place HEAD has been on this machine\ngit switch -c recovered f4e5d6c # Rescue a commit from the reflog by branching at it\ngit reset --soft HEAD~1         # Undo last commit, keep changes staged\ngit reset HEAD~1                # Undo last commit, keep changes in your files\ngit reset --hard HEAD~1         # Undo last commit and wipe the changes\ngit push --force-with-lease     # Push a rewritten branch of your own, safely',
        },
        {
          type: 'text',
          value:
            'Next up: how teams string all of this together in a real-world workflow, with feature branches, pull requests, and the daily rhythm of pulling before you start work.',
        },
      ],
    },
  ],
} satisfies Lesson
