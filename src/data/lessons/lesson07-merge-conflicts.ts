import type { Lesson } from '@/types'
export default {
  id: 7,
  title: 'Merge Conflicts',
  description: 'Resolve conflicts when branches collide',
  unlocks: [],
  steps: [
    {
      type: 'reading',
      id: 'why-conflicts',
      title: 'Why conflicts happen',
      content: [
        {
          type: 'text',
          value:
            'A **merge conflict** happens when two branches changed the **same lines** of the same file, and Git cannot tell which version you meant to keep.',
        },
        {
          type: 'text',
          value:
            'Say line 3 of `welcome.txt` said `Welcome to our newsletter!`. On `main` you changed it to `Welcome back!`. On `feature-banner` a colleague changed the same line to `Welcome to our amazing newsletter!`. When you merge, Git has two different lines competing for one spot. It refuses to guess, and tells you so:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git merge feature-banner',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'Auto-merging welcome.txt\nCONFLICT (content): Merge conflict in welcome.txt\nAutomatic merge failed; fix conflicts and then commit the result.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Nothing is broken',
          value:
            'The word CONFLICT looks alarming. It is not an error and you have not damaged anything. No commits were deleted, no work was lost, and both branches still exist exactly as they were. Git merged everything it could, paused on the handful of lines it could not, and is asking a question only a person can answer: which wording do you want? Conflicts are a normal part of working with other people. People who have used Git for years hit them every week.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'conflict-markers',
      title: 'Reading conflict markers',
      visualization: 'conflict-markers',
      content: [
        {
          type: 'text',
          value:
            'Git does not hide the conflict somewhere. It writes both versions straight into the file, wrapped in **conflict markers**. Those markers are three lines of angle brackets and equals signs, and they show where the disagreement starts, splits, and ends:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '<<<<<<< HEAD\nWelcome back!\n=======\nWelcome to our amazing newsletter!\n>>>>>>> feature-banner',
        },
        {
          type: 'text',
          value:
            '`HEAD` is Git\'s name for the branch you are standing on right now. It is the branch you were on when you typed `git merge`.',
        },
        {
          type: 'list',
          items: [
            'Between `<<<<<<< HEAD` and `=======` is what **your current branch** says.',
            'Between `=======` and `>>>>>>> feature-banner` is what the **incoming branch** says.',
            'The name after `>>>>>>>` tells you which branch that second version came from.',
          ],
        },
        {
          type: 'text',
          value:
            'Git\'s shorthand for the two halves is **ours** for the branch you are on and **theirs** for the branch coming in. Those two words show up in Git tools and in instructions other people give you, so they are worth recognising.',
        },
        {
          type: 'text',
          value:
            'Your job is to edit those lines down to the one version you want, then delete all three marker lines. Keep the top, keep the bottom, keep both, or write something new. The rest of the file is untouched and needs nothing from you.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'conflict-status',
      title: 'What git status looks like mid-conflict',
      content: [
        {
          type: 'text',
          value:
            'While a merge is paused, `git status` becomes your map. Run it any time you lose track of where you are:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git status',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'On branch main\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)\n        both modified:   welcome.txt\n\nno changes added to commit (use "git add" and/or "git commit -a")',
        },
        {
          type: 'text',
          value: 'This screen is telling you three things.',
        },
        {
          type: 'list',
          items: [
            '**You have unmerged paths** means a merge is in progress and paused. Git is waiting on you.',
            '**both modified: welcome.txt** is the list of files you have to fix. Only files under *Unmerged paths* have conflict markers in them.',
            'The lines in brackets are Git handing you your two exits: fix the files and commit, or run `git merge --abort` to back out.',
          ],
        },
        {
          type: 'text',
          value:
            'A merge often brings other files across without any trouble at all. Those show up in a *Changes to be committed* section, already staged and needing nothing from you. Leave them alone and work through *Unmerged paths*.',
        },
        {
          type: 'text',
          value:
            'Once you have fixed a file and staged it, it disappears from *Unmerged paths*. When that section is empty, you are ready to commit.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'resolution-workflow',
      title: 'Resolving a conflict step by step',
      content: [
        {
          type: 'text',
          value: 'The whole procedure, start to finish:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Run `git status` and note every file listed as *both modified*.',
            'Open the first of those files and find the `<<<<<<<` marker.',
            'Decide what the final lines should be: keep yours, keep theirs, keep both, or write a new version.',
            'Delete all three marker lines (`<<<<<<<`, `=======`, and `>>>>>>>`) so the file reads normally again.',
            'Run `git add <file>` to tell Git that file is settled.',
            'Repeat for every conflicted file, then commit to finish the merge.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# After editing welcome.txt and removing the markers:\ngit add welcome.txt\ngit commit -m "Merge feature-banner, keep the new welcome message"',
        },
        {
          type: 'text',
          value:
            'Git tools put buttons on this. Whichever one you use, its accept-yours and accept-theirs buttons keep the lines you picked and delete all three markers, exactly what you just did by hand, and that is why the markers were worth learning.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never leave a marker behind',
          value:
            'To Git, `<<<<<<< HEAD` is ordinary text. It will happily commit it, and the markers travel to everyone who takes a copy of the project. Before you stage, search the file for `<<<` and make sure there are no hits.',
        },
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-1',
      prompt:
        'Your team agreed on the wording from the feature branch. Edit the file so it keeps that line and no markers are left behind, then press Check:',
      fileName: 'welcome.txt',
      oursLabel: 'HEAD (main)',
      theirsLabel: 'feature-banner',
      oursContent: 'Welcome back!',
      theirsContent: 'Welcome to our amazing newsletter!',
      surroundingBefore: 'THE RIDGEWAY NEWSLETTER\nIssue 12',
      surroundingAfter: 'In this issue: the plant sale and the new gate.',
      acceptableResolutions: ['Welcome to our amazing newsletter!'],
      hints: [
        'Only one of the two lines should survive here. It is the one that came in from feature-banner.',
        'The incoming version is the lower one, below the middle marker.',
        'Delete the `Welcome back!` line and all three marker lines, leaving `Welcome to our amazing newsletter!` under the issue number.',
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-2',
      prompt:
        'Not every conflict is a choice between two rivals. Two people each added a credit line, and the two lines happened to land in the same spot. Both belong in the finished list. Edit the file so it keeps both:',
      fileName: 'credits.txt',
      oursLabel: 'HEAD (main)',
      theirsLabel: 'add-photo-credits',
      oursContent: 'Illustrations by Tom Blake',
      theirsContent: 'Photographs by Rosa Ibarra',
      surroundingBefore: 'With thanks to:',
      acceptableResolutions: [
        'Illustrations by Tom Blake\nPhotographs by Rosa Ibarra',
        'Photographs by Rosa Ibarra\nIllustrations by Tom Blake',
      ],
      hints: [
        'Nothing here is in competition. Tom drew the illustrations and Rosa took the photographs, so both names have been earned.',
        'The finished file should have two credit lines and zero markers.',
        'Delete the three marker lines and leave both names behind, one directly after the other.',
      ],
    },
    {
      type: 'reading',
      id: 'aborting-merge',
      title: 'Backing out with git merge --abort',
      content: [
        {
          type: 'text',
          value:
            'Sometimes you start a merge, see the conflicts, and realise this is not a decision you should make right now. Maybe you need to ask the person who wrote the other version first. You are not trapped.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git merge --abort',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your escape hatch',
          value:
            'This puts everything back exactly as it was one second before you typed `git merge`. The markers vanish from your files, the paused merge is cancelled, and both branches keep every commit they had. No work is lost, not yours and not your teammate\'s. You can walk away and merge again tomorrow. Remember this command: it turns a scary situation into a reversible one.',
        },
        {
          type: 'text',
          value:
            'It prints nothing at all when it works. That silence is Git saying the merge is off and you are back where you started.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'conflict-merge-walkthrough',
      title: 'Practice: a conflict from start to finish',
      mode: 'guided',
      brief:
        'The bakery site has two branches, and you are standing on `main`. On `main` the hours line in `hours.txt` was shortened to `Open daily.` On `opening-hours` a colleague rewrote that same line as `Open 7am to 6pm, every day.` and added a `directions.html` nobody on `main` has touched. **Your goal: merge `opening-hours` into `main` and finish the merge.** Rewrite a whole file in one line with `echo "your wording" > hours.txt`.',
      seed: {
        dir: 'bakery-site',
        setup: [
          { run: 'git init' },
          {
            write: {
              'index.html': '<h1>Corner Bakery</h1>\n',
              'hours.txt': 'Open every day.\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          { run: 'git switch -c opening-hours' },
          {
            write: {
              'hours.txt': 'Open 7am to 6pm, every day.\n',
              'directions.html': '<h2>Find us</h2>\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Spell out the opening hours"' },
          { run: 'git switch main' },
          { write: { 'hours.txt': 'Open daily.\n' } },
          { run: 'git add .' },
          { run: 'git commit -m "Shorten the hours line"' },
        ],
      },
      goals: [
        {
          id: 'merge-paused',
          label: 'The merge has started and paused on `hours.txt`',
          narration:
            'Start the merge and let it fail. Run `git merge opening-hours` and read the CONFLICT line it prints. Then run `git status` to see which file it stopped on, and `cat hours.txt` to read both versions with the markers around them. Notice that `directions.html` came across on its own and is already staged.',
          check: { kind: 'merge-in-progress' },
          hints: [
            'Name the branch whose work you want to bring in, not the one you are standing on',
            'The command is `git merge opening-hours`',
          ],
        },
        {
          id: 'merge-finished',
          label: '`hours.txt` holds one version, and a merge commit closes the merge',
          narration:
            'Decide what that line should say. Keep either version or write a new one that says both. Rewrite the file with `echo "..." > hours.txt`, which wipes the markers along with the old text. Then `git add hours.txt` to mark it resolved, and commit with `-m` to finish. Run `git log --oneline --graph` at the end to see the two lines of work join.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'merge-commit-exists', onBranch: 'main' },
              { kind: 'working-tree-clean' },
            ],
          },
          hints: [
            'Staging the file is what tells Git the conflict is settled, and `git status` will confirm it',
            'Rewrite the file, then `git add hours.txt`, then `git commit -m "..."`',
            'Run `echo "Open 7am to 6pm, every day." > hours.txt`, then `git add hours.txt`, then `git commit -m "Merge opening-hours"`',
          ],
        },
      ],
      completionMessage:
        'That is the whole thing. A conflict is a pause, a decision, a `git add`, and a commit. You will not enjoy them, but you will never again be stuck in one.',
    },
    {
      type: 'quiz',
      id: 'quiz-conflict-markers',
      question: 'Inside a conflict block, what does the `=======` line separate?',
      options: [
        {
          text: 'Changes you have staged from changes you have not staged yet',
          whyWrong:
            'That is the split `git status` shows you between sections. Conflict markers live inside a file and are about two branch versions of the same lines, not about staging.',
        },
        {
          text: 'The lines Git merged for you from the lines it could not merge',
          whyWrong:
            'Everything between `<<<<<<<` and `>>>>>>>` is unmerged. Lines Git handled on its own carry no markers at all and are not shown in the block.',
        },
        {
          text: 'The version from the branch you are on (above) from the version from the branch you are merging in (below)',
        },
        {
          text: 'Your local copy of the file from the copy stored on a server somewhere',
          whyWrong:
            'Conflict markers come from merging two branches, which happens entirely in your own repository. No server is involved in this at all.',
        },
      ],
      correctIndex: 2,
      explanation:
        'The block has a top half and a bottom half, and `=======` is the fence between them. Knowing which half is which is what lets you decide what to keep instead of guessing.',
    },
    {
      type: 'quiz',
      id: 'quiz-abort-merge',
      question:
        'You started merging winter-menu into main and Git reports a conflict in menu.txt. You are not confident about the other version and want to back out safely. What do you run?',
      options: [
        {
          text: '`git status`',
          whyWrong:
            'This shows you which files conflict but changes nothing. You would still be sitting in the paused merge with the markers in your files.',
        },
        {
          text: '`git merge --abort`',
        },
        {
          text: '`git add menu.txt`',
          whyWrong:
            'That tells Git the conflict is resolved and stages the file with the markers still in it. It takes you further into the merge, not out of it.',
        },
        {
          text: '`git commit -m "Merge winter-menu"`',
          whyWrong:
            'That tries to finish the merge. Git refuses while conflicts remain, and if you had staged the file first you would commit the broken version.',
        },
      ],
      correctIndex: 1,
      explanation:
        '`git merge --abort` is the only one of these that undoes anything. It rewinds to the moment before the merge started, so you can ask your teammate first and try again later with nothing lost.',
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
            'Explain why a conflict happens and know that it means Git paused, not that something broke',
            'Recognise the mid-conflict `git status` screen and read which files still need you',
            'Read `<<<<<<<`, `=======`, and `>>>>>>>` and tell which side came from which branch',
            'Resolve a conflict by editing the file down to the version you want, with no markers left behind',
            'Finish a merge by staging each fixed file and committing',
            'Walk away from a merge with `git merge --abort` without losing any work',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git merge <branch>    # start the merge that may conflict\ngit status            # see which files are still unmerged\ngit add <file>        # mark one file as resolved\ngit commit -m "..."   # finish the merge\ngit merge --abort     # cancel the merge and go back',
        },
        {
          type: 'text',
          value:
            'Next up is stashing: a way to set unfinished work aside for a few minutes when something urgent comes up, without committing a half-done change.',
        },
      ],
    },
  ],
} satisfies Lesson
