import type { Lesson } from '@/types'
export default {
  id: 9,
  title: 'Fixing Mistakes',
  description: 'Undo changes, fix commits, and recover lost work',
  unlocks: ['restore', 'reset', 'revert', 'reflog'],
  steps: [
    {
      type: 'reading',
      id: 'fixing-mistakes-intro',
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
            'You ran `git add` on a file you did not mean to include. It is now in the **staging area**, the packing table where you lay out what goes into the next commit. You want this file off the table without losing the edits you made.',
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
            '`--no-edit` means "keep the message exactly as it is". Pass `-m` instead when you want to change the wording.',
        },
        {
          type: 'text',
          value:
            'Amending does not edit the old commit. It builds a **replacement** and points your branch at that instead. The replacement gets its own **commit hash**. That is the short string of letters and numbers like `7f3a9c1` that Git uses as the name of a commit. To Git, it is a different commit that happens to look similar.',
        },
        {
          type: 'text',
          value:
            'That matters in one situation. If other people already have a copy of the original, their history and yours stop lining up. While the commits are yours alone, amend as freely as you like.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'fix-the-last-commit',
      title: 'Practice: fix the commit you just made',
      mode: 'goal',
      brief:
        'You are writing a novel. You committed `chapter-01.md` a minute ago and made two mistakes at once. The message reads `Add teh first two chapters`, and `chapter-02.md` was meant to go in with it and did not. **Your goal: end up with two commits rather than three, the newest one saying `Add the first two chapters` and holding both files.** Start with `git log --oneline` and `git status` to see where you are.',
      seed: {
        dir: 'salt-road',
        setup: [
          { run: 'git init' },
          { write: { 'outline.md': '# The Salt Road\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          {
            write: {
              'chapter-01.md': 'The road began at the harbour.\n',
              'chapter-02.md': 'Rain found them on the ridge.\n',
            },
          },
          { run: 'git add chapter-01.md' },
          { run: 'git commit -m "Add teh first two chapters"' },
        ],
      },
      goals: [
        {
          id: 'message-fixed',
          label: 'The newest commit says `Add the first two chapters`',
          check: { kind: 'head-message', includes: 'Add the first two chapters' },
          hints: [
            'A second commit saying "fix typo" is not the answer here. Replace the commit you already have.',
            'The flag that replaces the last commit is `--amend`',
            'Run `git commit --amend -m "Add the first two chapters"`',
          ],
        },
        {
          id: 'chapter-folded',
          label: '`chapter-02.md` is part of that same commit, and the history is still two commits long',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'commit-exists', containing: ['chapter-02.md'] },
              { kind: 'commit-count', count: 2 },
            ],
          },
          hints: [
            'Stage the forgotten file first, then amend. The amend picks up whatever is staged.',
            'Run `git add chapter-02.md`, then amend',
            'Run `git add chapter-02.md`, then `git commit --amend -m "Add the first two chapters"`, which fixes both mistakes in one go',
          ],
        },
      ],
      completionMessage:
        'Two mistakes, one command. `git log --oneline` shows two commits, and the newest one carries both chapters under the message you meant to write.',
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
            'To use it you need a way to name a commit. **HEAD** is the "you are here" marker for the branch you are on. Written inside a command, it means the commit that marker is sitting on, the newest one on your current branch. `HEAD~1` means one commit before that, `HEAD~2` two before it, and so on. A commit hash like `7f3c2a1` works anywhere `HEAD` does.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Undo the most recent commit:\ngit revert HEAD\n\n# Undo one specific older commit, leaving newer ones alone:\ngit revert 7f3c2a1',
        },
        {
          type: 'text',
          value:
            'Because revert only ever adds, it is safe on a branch other people are using. They pick up one extra commit and can read exactly what was undone and when. Nothing they already have stops being true.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'revert-a-bad-commit',
      title: 'Practice: undo a commit by adding one',
      mode: 'goal',
      brief:
        'This repository holds a family cookbook. The newest commit on `main` is `Add the deep-fried butter recipe`, and everybody hated that one on sight. **Your goal: get `deep-fried-butter.md` out of the cookbook by adding a commit that reverses that one, leaving the original where it is.** Run `git log --oneline` before and after so you can see what changed.',
      seed: {
        dir: 'family-cookbook',
        setup: [
          { run: 'git init' },
          { write: { 'contents.md': '# Family cookbook\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          { write: { 'soups.md': 'Leek and potato, thickened with a floury potato.\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Add the soup chapter"' },
          { write: { 'deep-fried-butter.md': 'Butter. Batter. Fryer. Regret.\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Add the deep-fried butter recipe"' },
        ],
      },
      goals: [
        {
          id: 'recipe-reverted',
          label: '`deep-fried-butter.md` is gone, undone by a fourth commit sitting on top of the original',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'file-absent', path: 'deep-fried-butter.md' },
              { kind: 'head-message', includes: 'Revert' },
              { kind: 'commit-count', count: 4 },
            ],
          },
          hints: [
            'Deleting the file by hand would work but would leave the original commit unexplained. Undo the commit itself.',
            'The command that undoes by adding is `git revert`, and it needs the name of a commit',
            'Run `git revert HEAD`. `HEAD` names the newest commit on the branch you are on.',
          ],
        },
      ],
      completionMessage:
        'Four commits now, not two. The deep-fried butter is still there for anyone reading the history, and directly above it sits the commit that took it out again.',
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
            'Every time your position moves, Git writes a line in a private log called the **reflog**, short for reference log. A commit moves you. So does a branch switch, a merge, and an undo. The reflog is the list of every place `HEAD` has been on this machine, newest first.',
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
            '91fc66c HEAD@{0}: reset: moving to HEAD~1\naf24571 HEAD@{1}: commit: Add the results chapter\n91fc66c HEAD@{2}: commit: Add the methods chapter\n2691fcd HEAD@{3}: commit (initial): Initial commit',
        },
        {
          type: 'text',
          value:
            'Each line gives you a label like `HEAD@{1}` and the commit hash you were standing on at that moment. The top line is the reflog writing down the very mistake you are undoing. `reset: moving to HEAD~1` is the reset that moved you off `af24571`.',
        },
        {
          type: 'text',
          value:
            'Notice that `HEAD@{0}` and `HEAD@{2}` show the same hash. That is not a mistake. The reset put you back exactly where that older commit was, so both lines describe the same spot. The line you want is `HEAD@{1}`: `af24571`, the commit you moved off. To undo a mistake, find the line describing the moment just before it and use that hash.',
        },
        {
          type: 'text',
          value:
            'The results chapter is not gone. Make a branch at that commit so it is safe again:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git switch -c recovered af24571',
        },
        {
          type: 'text',
          value:
            'That is `git switch -c`, the way you start a branch, with a commit hash on the end saying where to start it. A branch called `recovered` now points at that commit. Git holds on to any commit a branch points at, and `git switch` has moved you onto the new branch. `git reset --hard af24571` gets you back to that commit too, and `git reset` is the next step in this lesson.',
        },
        {
          type: 'text',
          value:
            'This is why a "lost" commit is usually still there. If the commit was ever made on your computer, its hash is in the reflog, and a commit Git still holds can be brought back. Two limits worth knowing. The reflog lives only on your machine, so it says nothing about work done on anyone else\'s. And Git clears old entries out on a timer. An entry for a commit that nothing points at any more, which is exactly the kind you are rescuing after a `reset` or an `--amend`, goes after about thirty days. Thirty days is the figure to count on. The reflog rescues recent mistakes. It is not an archive.',
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
            'A branch is a pointer at one commit, the newest one on that branch. `git reset` moves that pointer backwards, so the commits after it are no longer part of the branch. What happens to the *work* from those commits depends on which of three modes you pick.',
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
      type: 'sandbox-exercise',
      id: 'reflog-rescue',
      title: 'Practice: destroy a commit, then bring it back',
      mode: 'guided',
      brief:
        'This is a doctoral thesis. A `chapter-03-results.md` is sitting in the folder, written this afternoon and never committed. **Your goal: commit it, throw that commit away with `git reset --hard`, and then rescue it out of the reflog.** Watch what happens carefully. Nothing else in Git turns fear into confidence this quickly.',
      seed: {
        dir: 'thesis',
        setup: [
          { run: 'git init' },
          { write: { 'outline.md': '# Nitrate in the Wye\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          { write: { 'chapter-02-methods.md': 'We sampled the river every fortnight.\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Add the methods chapter"' },
          {
            write: {
              'chapter-03-results.md': 'Nitrate fell by a third after the buffer strips.\n',
            },
          },
        ],
      },
      goals: [
        {
          id: 'committed',
          label: '`chapter-03-results.md` is safely inside a commit called `Add the results chapter`',
          narration:
            'Stage `chapter-03-results.md` and commit it with the message `Add the results chapter`. Then run `git log --oneline` and look at the top line. The seven characters at the start of it are the commit hash. You are about to need it.',
          check: { kind: 'commit-exists', messageIncludes: 'Add the results chapter' },
          hints: [
            'This is the ordinary two-step you already know: stage, then commit',
            'Run `git add chapter-03-results.md`, then `git commit -m "Add the results chapter"`',
          ],
        },
        {
          id: 'destroyed',
          label: 'The commit is off `main`, and the chapter is gone from the folder',
          narration:
            'Now break it on purpose. Run `git reset --hard HEAD~1`. Then run `ls` and `git log --oneline`. An afternoon of writing has gone from the folder and the commit has gone from the history. Nothing on screen suggests the work still exists anywhere. This is the moment people panic.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'file-absent', path: 'chapter-03-results.md' },
              { kind: 'commit-count', count: 2 },
            ],
          },
          hints: [
            'One commit back is `HEAD~1`, and the mode that also rewrites your files is `--hard`',
            'Run `git reset --hard HEAD~1`',
          ],
        },
        {
          id: 'recovered',
          label: 'A branch called `recovered` holds the commit again, and you are standing on it',
          narration:
            'Run `git reflog`. The line that reads `commit: Add the results chapter` begins with the seven-character hash of the commit you just destroyed. Copy those seven characters and run `git switch -c recovered` followed by them. Then run `ls` and `git log --oneline` and watch the chapter come back.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'on-branch', name: 'recovered' },
              { kind: 'file-present', path: 'chapter-03-results.md' },
            ],
          },
          hints: [
            '`git reflog` lists every place HEAD has been, newest first, with a hash on each line',
            'Read the hash off the `commit: Add the results chapter` line, then start a branch at it',
            'Run `git switch -c recovered <hash>`, pasting the seven characters from that reflog line in place of `<hash>`',
          ],
        },
      ],
      completionMessage:
        'You destroyed a commit and brought it back in three commands. `git reset --hard` is the most dangerous thing in this lesson and you now know its antidote. A commit that was ever made on this machine is in the reflog, and a commit in the reflog can come home.',
    },
    {
      type: 'quiz',
      id: 'quiz-reset-vs-revert',
      question:
        'You made a commit on your own branch two minutes ago and nobody else has a copy. The work in it is fine. You only want the commit itself gone, so you can fold those changes into a bigger commit later. What do you run?',
      options: [
        {
          text: '`git reset --hard HEAD~1`',
          whyWrong:
            'This undoes the commit and takes the work with it. `--hard` rewrites your files to match the older commit, so what you wanted to keep is wiped.',
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
        '`--soft` moves the branch pointer back one commit and leaves everything else exactly as it was, so the changes are sitting in the staging area ready to go into whatever commit you make next. Nobody else has these commits, so rewriting this bit of history affects nobody but you.',
    },
    {
      type: 'quiz',
      id: 'quiz-wrong-branch',
      question:
        'You made three commits on `main` that were meant to go on a new branch called `add-search`. What gets the commits onto `add-search` and `main` back to where it started?',
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
      id: 'committed-a-secret',
      title: 'If you commit a password or an API key',
      content: [
        {
          type: 'text',
          value:
            'You put a password, an API key, or an access token in a file and committed it. This happens constantly, to people who have used Git for years. What you do in the next five minutes matters far more than anything you do to your Git history.',
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
            'Deleting the commit does not undo the leak. If the repository has been copied anywhere at all, the value sits in every one of those copies, and none of them find out that you changed your mind. A public repository is read by automated scanners within seconds. The secret is out from the moment it leaves your machine.',
        },
        {
          type: 'text',
          value:
            'Once the secret has been rotated, the old value is worthless and cleanup becomes optional. If you want it out of your history anyway, add the file to `.gitignore` so it stops coming back, then follow the GitHub guide on [removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). Rotation has already made you safe.',
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
            'Undo a commit with `git revert`, which adds rather than erases',
            'Find a commit you thought you had destroyed in `git reflog` and bring it back by branching at its hash',
            'Choose between `--soft`, `--mixed`, and `--hard` on `git reset`, and name the one that destroys work',
            'Do the one thing that actually matters when a secret gets committed: rotate it',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git restore --staged file.txt   # Take a file out of the staging area\ngit restore file.txt            # Throw away uncommitted edits (no undo)\ngit commit --amend -m "msg"     # Replace the commit you just made\ngit commit --amend --no-edit    # Same, keeping the old message\ngit revert HEAD                 # Add a commit that undoes the last one\ngit reflog                      # Every place HEAD has been on this machine\ngit switch -c recovered af24571 # Rescue a commit from the reflog by branching at it\ngit reset --soft HEAD~1         # Undo last commit, keep changes staged\ngit reset HEAD~1                # Undo last commit, keep changes in your files\ngit reset --hard HEAD~1         # Undo last commit and wipe the changes',
        },
        {
          type: 'text',
          value:
            'Everything so far has lived in one repository in one place. Next up are remotes: a second copy of your repository on a server, so your work survives a dead laptop and other people can see it.',
        },
      ],
    },
  ],
} satisfies Lesson
