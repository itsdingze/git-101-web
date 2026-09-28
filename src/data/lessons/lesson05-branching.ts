import type { Lesson } from '@/types'
export default {
  id: 5,
  title: 'Branching',
  description: 'Work on something new without risking the version that already works',
  unlocks: ['branch', 'switch', 'checkout'],
  steps: [
    {
      type: 'reading',
      id: 'why-branches',
      title: 'The problem branches solve',
      content: [
        {
          type: 'text',
          value:
            'You have a class project in a folder. It works. It is not amazing, but it holds together, and you could hand it in tomorrow if you had to.',
        },
        {
          type: 'text',
          value:
            'Now you want to try something big. Rewrite the layout. Restructure how the parts fit together. You are honestly not sure it will work, and you might throw the whole attempt away. Without Git you have two choices:',
        },
        {
          type: 'list',
          items: [
            'Change the working version in place, and hope you can undo it all if the experiment fails.',
            'Copy the whole folder to `project-v2-FINAL`, work in there, and figure out later which copy was the real one.',
          ],
        },
        {
          type: 'text',
          value:
            'Both are bad. The first puts the version you can hand in at risk. The second is how you end up with `project-v2-FINAL`, then `project-v2-FINAL-actual`, then `project-v2-use-this-one`. Nothing tells you what is different between them.',
        },
        {
          type: 'text',
          value:
            'A **branch** is the clean version of that second idea. Git keeps one folder on your computer and lets you keep two separate lines of work inside it. You experiment as recklessly as you like. The version you could hand in tomorrow sits untouched, and you can be back on it in about a second.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'what-are-branches',
      title: 'What a branch is',
      content: [
        {
          type: 'text',
          value:
            'A **branch** is a name for one line of work. You have been using one all along without thinking about it: `main` is a branch, and every commit you have made has gone onto it.',
        },
        {
          type: 'text',
          value:
            'The important part is that a branch moves forward with you. Every time you commit while you are on a branch called `add-navbar`, that branch advances to your new commit. `main` stays exactly where you left it. Two names, each remembering a different point in your project.',
        },
        {
          type: 'text',
          value:
            'Git also keeps a marker called **HEAD**, which is its "you are here" sign. HEAD says which branch you are on right now, so Git knows which branch to move forward when you commit, and which version of your files to show you. Switching branches is nothing more than moving that marker.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Why creating a branch is instant',
          value:
            'Creating a branch copies nothing. Underneath, a branch is a **pointer**: a tiny file holding the ID of one commit. Making a new one writes about forty characters to disk. That is why creating a branch finishes before you have let go of the Enter key, even on a huge project.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'branching',
    },
    {
      type: 'reading',
      id: 'creating-branches',
      title: 'Creating and switching',
      content: [
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch feature-login      # Create the branch, stay where you are\ngit switch feature-login      # Move onto it\n\n# Or both at once:\ngit switch -c feature-login',
        },
        {
          type: 'text',
          value:
            'The `-c` flag (short for `--create`) makes the branch and moves you onto it in one step. It is what you will reach for almost every time.',
        },
        {
          type: 'text',
          value:
            'Branch names cannot contain spaces, so use dashes: `add-navbar`, `fix-broken-links`, `try-dark-mode`. Name the branch after the work. A name you wrote today should still tell you what it was for when you come back to it next week.',
        },
        {
          type: 'text',
          value:
            'Older tutorials write `git checkout -b add-navbar` instead. It does the same thing and still works. `git switch` arrived in Git 2.23 because `checkout` had been given too many unrelated jobs over the years. If you find `checkout -b` in an answer online, it is not wrong, only old.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-switch-c',
      prompt: 'Build the command that creates a new branch called "feature" and moves you onto it:',
      availableBlocks: ['git', 'switch', '-c', 'branch', 'feature', 'checkout', '-b'],
      correctAnswer: ['git', 'switch', '-c', 'feature'],
      acceptableAnswers: [['git', 'checkout', '-b', 'feature']],
      hints: [
        'You want the one command that creates and moves in a single step',
        'Start with `git switch`, then the flag that means create',
        'It is `git switch -c feature`',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-new-branch-contents',
      question:
        'You are on `main` and your project has ten commits behind it. You run `git switch -c fix-typo`. What does the new `fix-typo` branch contain right now?',
      options: [
        {
          text: 'Nothing yet. A new branch starts empty, so you build your files up on it again.',
          whyWrong:
            'A new branch starts at the commit you were standing on, not at zero. `fix-typo` begins with every file and all ten commits already there. Git would be painful to use if branching meant starting over.',
        },
        {
          text: 'Only the changes you have made but not committed yet.',
          whyWrong:
            'Uncommitted edits are not what a branch is made of. `fix-typo` starts with the whole project as of the latest commit on `main`, and any uncommitted edits you had come along with you.',
        },
        {
          text: 'Everything `main` has: all ten commits and every file. It starts identical, and only differs once you commit on it.',
        },
        {
          text: 'A copy of your files, but no history. The ten commits belong to `main` only.',
          whyWrong:
            'Branches share history rather than owning it. `fix-typo` can see all ten commits. Only the new commits you make after branching end up on one branch and not the other.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Creating a branch starts a new name at the exact commit you were standing on, so `fix-typo` and `main` are identical the moment it exists. Nothing is copied, nothing is lost, and `main` is not touched at all. The two only begin to differ when you make a commit. Whichever branch you are on is the one that moves.',
    },
    {
      type: 'sandbox-exercise',
      id: 'branch-isolation-walkthrough',
      title: 'Watch a branch keep work separate',
      mode: 'guided',
      brief:
        'Below is a project with one commit on `main`, holding `index.html` and `style.css`. You have also written `navbar.html`, about a dozen lines of markup, and it is sitting in the folder with nothing about it saved to Git yet. You are going to put that file on its own branch, then watch it vanish and come back as you switch branches. This is the part that makes branches finally click, so read each line before you type. Run `ls` and `git status` whenever you want to look around.',
      seed: {
        dir: 'my-project',
        setup: [
          { run: 'git init' },
          {
            write: {
              'index.html': '<h1>Hello</h1>\n',
              'style.css': 'body { font-family: sans-serif; }\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
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
        ],
      },
      goals: [
        {
          id: 'on-new-branch',
          label: 'You are standing on a new branch called `add-navbar`',
          narration:
            'You are on `main`, and the site currently works. Start a branch for the navbar work and move onto it in one step. Call it `add-navbar`.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'branch-exists', name: 'add-navbar' },
              { kind: 'on-branch', name: 'add-navbar' },
            ],
          },
          hints: [
            '`git switch` moves you between branches, and one flag creates the branch first',
            'It is `git switch -c add-navbar`',
          ],
        },
        {
          id: 'navbar-committed',
          label: '`navbar.html` is committed on `add-navbar`',
          narration:
            '`navbar.html` came along with you, because Git leaves a file it is not tracking yet exactly where it is. Stage it and commit it, so the navbar work is saved on this branch and nowhere else.',
          check: {
            kind: 'commit-exists',
            containing: ['navbar.html'],
            onBranch: 'add-navbar',
          },
          hints: [
            'Two commands: the staging one, then the saving one',
            '`git add .` then `git commit -m "Add navbar"`',
          ],
        },
        {
          id: 'back-on-main',
          label: 'Back on `main`, where `navbar.html` is nowhere to be seen',
          narration:
            'Look at that output: it starts with `[add-navbar]`. Git is telling you which branch the commit landed on. Now go back to `main`, and once you are there run `ls` to list the files in your folder.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'on-branch', name: 'main' },
              { kind: 'file-absent', path: 'navbar.html' },
            ],
          },
          hints: [
            '`git switch` followed by the name of the branch you want to be on',
            'It is `git switch main`, then `ls`',
          ],
        },
        {
          id: 'navbar-returns',
          label: 'Back on `add-navbar`, where `navbar.html` is waiting for you',
          narration:
            '`navbar.html` was not in that list. Read this carefully: the file has not been deleted and nothing has gone wrong. It is safe inside the commit on `add-navbar`. It is missing from your folder because the `main` version of the project has never included it, and your folder always shows the branch you are standing on. Switch back to `add-navbar` and run `ls` one more time.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'on-branch', name: 'add-navbar' },
              { kind: 'file-present', path: 'navbar.html' },
            ],
          },
          hints: ['Switch by name: `git switch add-navbar`'],
        },
      ],
      completionMessage:
        'That disappearing act is the entire point of branches. One folder, and Git swaps its contents to match whichever branch you are on. Your navbar work is sitting safely on `add-navbar`, and `main` is still the version you could hand in tomorrow, exactly as you left it. Keep switching back and forth below if you want to watch it again.',
    },
    {
      type: 'quiz',
      id: 'quiz-switching-files',
      question:
        'You committed `navbar.html` on the `add-navbar` branch, then ran `git switch main`. `navbar.html` is no longer in your project folder. What happened to it?',
      options: [
        {
          text: 'Git deleted it, so you would have to write the file again.',
          whyWrong:
            'Nothing was deleted. The commit on `add-navbar` still holds the file, and `git switch add-navbar` brings it right back into your folder.',
        },
        {
          text: 'It is safe in the commit on `add-navbar`. Git rewrote your folder to match `main`, and `main` has never had that file.',
        },
        {
          text: 'It was moved somewhere hidden, and you need a special recovery command to get it back.',
          whyWrong:
            'No rescue command is needed, because the file was never in danger. Switching back with `git switch add-navbar` is the whole recovery.',
        },
        {
          text: 'It is still there. `git switch` only changes history, never the files in your folder.',
          whyWrong:
            'Switching does change the files in your folder, and that is deliberate. Showing you the version of the project that belongs to that branch is exactly what a branch is for.',
        },
      ],
      correctIndex: 1,
      explanation:
        'Your folder always shows the version of the project belonging to whichever branch HEAD is pointing at. When you switch, Git rewrites the folder to match: adding files, removing files, changing lines. Every version still exists in the commits. You are only ever looking at one of them at a time.',
    },
    {
      type: 'reading',
      id: 'listing-branches',
      title: 'Listing and deleting branches',
      content: [
        {
          type: 'text',
          value:
            'Once you have a few branches, you will want to see what exists and tidy away the ones you have finished with.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch               # List your branches\ngit branch -d old-idea   # Delete a branch you are finished with',
        },
        {
          type: 'text',
          value: 'On its own, `git branch` prints one name per line and marks where you are with an asterisk:',
        },
        {
          type: 'code',
          language: 'text',
          value: '  add-navbar\n* main',
        },
        {
          type: 'text',
          value:
            'You cannot delete the branch you are currently standing on. Switch to `main` first, then delete. Deleting a branch removes the name, not your project. The commits it pointed at are still in the repository.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'When `-d` refuses, that is a safety feature',
          value:
            'If the branch still holds commits you have not brought into another branch yet, `git branch -d` stops and says `error: the branch \'old-idea\' is not fully merged`. That is not a bug and you did nothing wrong. Git is asking whether you really mean to throw that work away. If you do, `git branch -D` (capital D) deletes it anyway, and those commits become much harder to find. If you are unsure, leave the branch alone. Keeping it costs you nothing.',
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
            'Say why a branch beats copying your project folder to `project-v2-FINAL`',
            'Create a branch and move onto it with a single command',
            'Switch between branches, knowing your folder changes to match the one you are on',
            'Trust that work committed on one branch is still there when you leave it and come back',
            'List your branches and delete the ones you have finished with',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch -c add-navbar   # Create a branch and move onto it\ngit switch main            # Move to a branch that already exists\ngit branch                 # List your branches (* marks where you are)\ngit branch -d add-navbar   # Delete a branch you have finished with',
        },
        {
          type: 'text',
          value:
            'Next up is merging: how you take the navbar work sitting on `add-navbar` and fold it into `main`, so the version you hand in finally includes it.',
        },
      ],
    },
  ],
} satisfies Lesson
