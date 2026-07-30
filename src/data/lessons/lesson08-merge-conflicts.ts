import type { Lesson } from '@/types'
export default {
  id: 8,
  title: 'Merge Conflicts',
  description: 'Resolve conflicts when branches collide',
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
            'Say line 3 of `index.html` said `Welcome to our website!`. On `main` you changed it to `Welcome back!`. On `feature-banner` a teammate changed the same line to `Welcome to our amazing website!`. When you merge, Git has two different lines competing for one spot. It refuses to guess, and tells you so:',
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
            'Auto-merging index.html\nCONFLICT (content): Merge conflict in index.html\nAutomatic merge failed; fix conflicts and then commit the result.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Nothing is broken',
          value:
            'The word CONFLICT looks alarming. It is not an error and you have not damaged anything. No commits were deleted, no work was lost, and both branches still exist exactly as they were. Git merged everything it could, paused on the handful of lines it could not, and is asking a question only a person can answer: which wording do you want? Conflicts are a normal part of working with other people. Experienced developers hit them every week.',
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
            '<<<<<<< HEAD\nWelcome back!\n=======\nWelcome to our amazing website!\n>>>>>>> feature-banner',
        },
        {
          type: 'text',
          value:
            '`HEAD` is Git\'s name for **the branch you are standing on right now**, the one you were on when you typed `git merge`.',
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
            'On branch main\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)\n        both modified:   index.html\n\nno changes added to commit (use "git add" and/or "git commit -a")',
        },
        {
          type: 'text',
          value:
            'This screen is telling you three things.',
        },
        {
          type: 'list',
          items: [
            '**You have unmerged paths** means a merge is in progress and paused. Git is waiting on you.',
            '**both modified: index.html** is the list of files you have to fix. Only files under *Unmerged paths* have conflict markers in them.',
            'The lines in brackets are Git handing you your two exits: fix the files and commit, or run `git merge --abort` to back out.',
          ],
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
            'Repeat for every conflicted file, then run `git commit` to finish the merge.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# After editing index.html and removing the markers:\ngit add index.html\ngit commit -m "Merge feature-banner, keep the new welcome message"',
        },
        {
          type: 'text',
          value:
            'Git pre-writes a merge commit message for you, so plain `git commit` works too. An editor opens with a message like `Merge branch \'feature-banner\'` already filled in, and you save and close it.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never leave a marker behind',
          value:
            'To Git, `<<<<<<< HEAD` is ordinary text. It will happily commit it, and your file will be broken the moment someone runs it. Before you stage, search the file for `<<<` and make sure there are no hits.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'resolve-in-vs-code',
      title: 'Resolving in VS Code',
      content: [
        {
          type: 'text',
          value:
            'Now that you can read the markers, here is how most people actually handle them day to day. Open a conflicted file in **VS Code** and it colours the two versions and puts a small row of clickable links directly above the `<<<<<<<` line:',
        },
        {
          type: 'list',
          items: [
            '**Accept Current Change** keeps the top version, the one from the branch you are on.',
            '**Accept Incoming Change** keeps the bottom version, the one from the branch you are merging in.',
            '**Accept Both Changes** keeps both versions, one after the other.',
            '**Compare Changes** opens a side-by-side view first, for a closer look before you choose.',
          ],
        },
        {
          type: 'text',
          value:
            'Clicking one of those does **exactly** what you would have done by hand: it keeps the lines you picked and deletes all three marker lines. There is no extra Git command hiding behind the button, and nothing you could not have typed yourself. That is why the markers were worth learning first. The buttons are only a faster way to edit the same text.',
        },
        {
          type: 'text',
          value:
            'The **Source Control** panel from lesson 2 groups conflicted files under **Merge Changes**, so you can find them by clicking instead of running `git status`. After you have resolved a file, the `+` next to it stages it, the same job `git add` does. The tick at the top commits, finishing the merge.',
        },
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
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-1',
      prompt:
        'Your team agreed on the wording from the feature branch. Resolve this conflict so the file keeps that line and no markers are left behind:',
      fileName: 'index.html',
      oursLabel: 'HEAD (main)',
      theirsLabel: 'feature-banner',
      oursContent: 'Welcome back!',
      theirsContent: 'Welcome to our amazing website!',
      surroundingBefore: '<body>\n  <header>',
      surroundingAfter: '  </header>\n</body>',
      acceptableResolutions: ['Welcome to our amazing website!'],
      hints: [
        'Only one of the two lines should survive here: the one that came in from feature-banner.',
        'The incoming version is the lower one, below the `=======` line.',
        'Click "Keep theirs". It does the same thing as deleting the HEAD line and all three markers by hand.',
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-2',
      prompt:
        'Not every conflict is a choice between two rivals. Both developers added a stylesheet the project needs, and the lines happened to land in the same spot. Resolve this by keeping both:',
      fileName: 'styles.css',
      oursLabel: 'HEAD (main)',
      theirsLabel: 'feature-dark-mode',
      oursContent: '@import "components.css";',
      theirsContent: '@import "dark-theme.css";',
      acceptableResolutions: [
        '@import "components.css";\n@import "dark-theme.css";',
        '@import "dark-theme.css";\n@import "components.css";',
      ],
      hints: [
        'Nothing here is in competition. The project needs the components styles and the dark theme.',
        'The finished file should have two import lines and zero markers.',
        'Click "Keep both", the same button VS Code calls "Accept Both Changes".',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'stage-resolved',
      prompt:
        'You edited resolved-file.txt, picked the wording you wanted, and deleted every marker. Tell Git this file is settled so it drops off the unmerged list:',
      expectedCommand: 'git add resolved-file.txt',
      acceptableVariants: [],
      successOutput: '',
      hints: [
        'Staging a conflicted file is how you tell Git you have resolved it.',
        'It is the same `git add` you already know.',
        'The filename is resolved-file.txt.',
      ],
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
          text: 'Your local copy of the file from the copy stored on GitHub',
          whyWrong:
            'Conflict markers come from merging two branches, which happens entirely on your own computer. GitHub is not involved in this at all.',
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
        'You started merging feature-login into main and Git reports a conflict in auth.js. You are not confident about the other version and want to back out safely. What do you run?',
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
          text: '`git add auth.js`',
          whyWrong:
            'That tells Git the conflict is resolved and stages the file with the markers still in it. It pushes you further into the merge, not out of it.',
        },
        {
          text: '`git commit`',
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
            'Resolve a conflict by hand or with VS Code\'s Accept Current / Incoming / Both buttons, knowing they do the same thing',
            'Finish a merge by staging each fixed file and committing',
            'Walk away from a merge with `git merge --abort` without losing any work',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git status            # see which files are still unmerged\ngit add <file>        # mark one file as resolved\ngit commit            # finish the merge\ngit merge --abort     # cancel the merge and go back',
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
