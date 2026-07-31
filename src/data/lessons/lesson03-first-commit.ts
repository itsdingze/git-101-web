import type { Lesson } from '@/types'
export default {
  id: 3,
  title: 'Your First Commit',
  description: 'Stage files, write good commit messages, and view history',
  steps: [
    {
      type: 'reading',
      id: 'staging-files',
      title: 'Staging files',
      content: [
        {
          type: 'text',
          value:
            'Before you can save a snapshot, you have to **stage** your changes. Staging means telling Git "include this file in the next snapshot". You choose what goes in, one file at a time if you want:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git add filename.txt    # Stage one specific file\ngit add .               # Stage everything in the folder you are in',
        },
        {
          type: 'text',
          value:
            'You will also see `git add -A` written down. The difference is small: `git add .` stages everything inside the folder you are currently standing in, while `git add -A` stages everything in the whole project no matter which folder you run it from. Run either one from the top folder of your project and they do the same thing.',
        },
        {
          type: 'text',
          value:
            'Why bother staging at all? Because you often change five things and only two of them are finished. Staging lets you commit the finished work and leave the rest sitting there, still in progress.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-add',
      prompt: 'Build the command to stage everything in the folder you are standing in:',
      availableBlocks: ['git', 'add', 'commit', '.', '-m', '-A', 'stage'],
      correctAnswer: ['git', 'add', '.'],
      acceptableAnswers: [['git', 'add', '-A']],
      hints: [
        'Start with "git add"',
        'A dot means "everything here". `git add -A` is accepted too, and from the top folder of your project it does the same thing.',
      ],
    },
    {
      type: 'reading',
      id: 'committing',
      title: 'Making a commit',
      content: [
        {
          type: 'text',
          value:
            'A **commit** is a saved snapshot of everything you staged. Every commit needs a message describing what changed:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git commit -m "Initial commit"',
        },
        {
          type: 'text',
          value:
            'The `-m` flag lets you write the message right there on the same line. Leave `-m` off and Git opens a text editor instead and waits for you to type a longer message.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Stuck in a screen you cannot type in?',
          value:
            'That editor is often **Vim**, a program where normal typing does not behave the way you expect — and there is no visible way out. To escape: press `Esc`, then type `:wq`, then press `Enter`. That saves and quits. Memorise those three keystrokes. Every developer needs them at least once.',
        },
        {
          type: 'text',
          value: 'To avoid meeting Vim at all, tell Git to use an editor you already know:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Use VS Code as your Git editor:\ngit config --global core.editor "code --wait"\n\n# Or use nano, a small and simple terminal editor:\ngit config --global core.editor "nano"',
        },
        {
          type: 'text',
          value:
            'The `code --wait` line needs VS Code installed. `nano` already exists on macOS and Linux. On Windows it comes bundled with Git, so run it from Git Bash, the terminal the Git installer added in lesson 1.',
        },
        {
          type: 'text',
          value:
            'When a commit succeeds, Git prints a line like `[main (root-commit) 7f3a9c1] Initial commit`. The words `root-commit` only show up on the very first commit in a repository, and `7f3a9c1` is the beginning of that commit\'s unique ID.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'commit-messages',
      title: 'Writing good commit messages',
      content: [
        {
          type: 'text',
          value:
            'Six months from now, your commit messages are the only explanation of what you did. Three conventions cover almost every team:',
        },
        {
          type: 'list',
          items: [
            '**Write the message as an instruction**, so "Add contact form" rather than "Added contact form". You will also hear this called *imperative mood*. The test: the sentence "If applied, this commit will *add contact form*" should read correctly.',
            '**Keep the first line under 50 characters** so a whole list of them is easy to scan.',
            '**Put the detail in a body after a blank line.** The first line says what changed. The body says why.',
          ],
        },
        {
          type: 'code',
          language: 'text',
          value:
            'Add contact form to homepage\n\nCreate a form with name, email, and message fields.\nForm data is saved to the database and sends an email notification.',
        },
        {
          type: 'text',
          value:
            'Some teams use a format called **[Conventional Commits](https://www.conventionalcommits.org)**: `feat: add auth`, `fix: resolve login bug`, `docs: update README`. The prefix makes a long history much easier to scan.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'git-diff',
      title: 'Viewing changes with git diff',
      visualization: 'diff-walkthrough',
      content: [
        {
          type: 'text',
          value:
            '`git status` tells you *which* files changed. `git diff` tells you *what* changed inside them, line by line:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git diff              # Changes you have made but not staged yet\ngit diff --staged     # Changes you have staged for the next commit',
        },
        {
          type: 'text',
          value:
            'Lines starting with `+` were added, lines starting with `-` were removed. Reading the diff before you commit is the cheapest way to catch a mistake.',
        },
        {
          type: 'text',
          value:
            'You may also see `git diff --cached` in older tutorials. It does exactly the same thing as `--staged`. Both work, but `--staged` is the clearer name.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-diff-staged',
      prompt: 'Build the command to see staged changes:',
      availableBlocks: ['git', 'diff', '--staged', 'status', '--cached', 'log'],
      correctAnswer: ['git', 'diff', '--staged'],
      acceptableAnswers: [['git', 'diff', '--cached']],
      hints: ['Start with "git diff"', 'Add the --staged flag'],
    },
    {
      type: 'reading',
      id: 'git-log',
      title: 'Viewing history with git log',
      content: [
        {
          type: 'text',
          value: '`git log` shows every commit in your repository, newest first:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git log                    # Full history, several lines per commit\ngit log --oneline          # Compact, one line per commit',
        },
        {
          type: 'text',
          value:
            'Each commit shows who made it, when, the message, and its **hash**. A hash is the unique ID Git generated for that commit. The `--oneline` flag trims all that down to the short hash and the message, which is what you want most of the time.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'log-filtering',
      title: 'Filtering history',
      content: [
        {
          type: 'text',
          value:
            'As a project grows, `git log` gets very long. A few filters keep it readable:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git log --oneline -5                 # Just the last 5 commits\ngit log --grep="fix"                 # Commits whose message contains "fix"\ngit log --author="Jane"              # Commits by a specific person',
        },
        {
          type: 'text',
          value:
            'You do not need to memorise these. Knowing they exist is enough, so you can look them up the day you need them.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'first-commit-loop',
      title: 'Practice: your first commit, start to finish',
      mode: 'goal',
      brief:
        'Below is a folder called `my-project` holding two files, `index.html` and `style.css`. Git is already watching the folder, but nothing in it has ever been saved into a commit. **Your goal: get both files into a commit.** No steps this time, and no order to follow. Every command in this lesson works down there, and `git status` will tell you where you stand whenever you lose track. It is a real Git running inside your browser on a folder of its own, so nothing you type can break anything, on your computer or anywhere else. Type `help` for the list of commands it knows.',
      seed: {
        dir: 'my-project',
        setup: [
          {
            write: {
              'index.html': '<h1>Hello</h1>\n',
              'style.css': 'body { font-family: sans-serif; }\n',
            },
          },
          { run: 'git init' },
        ],
      },
      goals: [
        {
          id: 'staged',
          label: 'Both files are in the staging area',
          check: { kind: 'files-staged', paths: ['index.html', 'style.css'] },
          hints: [
            'Run `git status` first. It tells you what Git can see and what it is ignoring for now.',
            'Staging is the step between editing and saving. The command is `git add`.',
            'A dot means "everything in this folder", so `git add .` takes both files in one go.',
          ],
        },
        {
          id: 'committed',
          label: 'Both files are saved in a commit',
          check: { kind: 'commit-exists', containing: ['index.html', 'style.css'] },
          hints: [
            'Staging only picks what goes in. Saving the snapshot is a separate command.',
            'It is `git commit`, and it needs a message.',
            'Write the message inline: `git commit -m "Initial commit"`.',
          ],
        },
      ],
      completionMessage:
        'That is the core loop of Git, and you will run most of it thousands of times. `git init` runs once per project to create the repository, and the other four come round again and again: `git status` to see where you stand, `git add` to choose what goes in, `git commit` to save the snapshot, and `git log` to read your history back. Try `git log --oneline` below before you move on. The terminal stays live, so keep poking at it.',
    },
    {
      type: 'quiz',
      id: 'quiz-staging',
      question:
        'You made a new folder, put one file in it, and want Git to start keeping its history. What order do you run things in?',
      options: [
        {
          text: 'git add . → git init → git commit -m "Initial commit"',
          whyWrong:
            '`git add` only works inside a repository. Until `git init` has run there is no repository yet, so Git answers with an error instead of staging the file.',
        },
        {
          text: 'git init → git commit -m "Initial commit" → git add .',
          whyWrong:
            'A commit saves whatever is staged. Nothing is staged yet at that point, so Git refuses with "nothing added to commit" and no snapshot is made.',
        },
        {
          text: 'git init → git add . → git commit -m "Initial commit"',
        },
        {
          text: 'git init → git status → git commit -m "Initial commit"',
          whyWrong:
            '`git status` only reports what Git sees and never moves a file into staging. The commit would still have nothing to save, so `git add` cannot be skipped.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Each step depends on the one before it: `git init` creates the repository, `git add` chooses what goes in the snapshot, and `git commit` saves it. Skip the middle step and there is nothing for the commit to record.',
    },
    {
      type: 'quiz',
      id: 'quiz-diff',
      question:
        'You edited a file and have not run `git add` yet. What does plain `git diff`, with no flags, show you?',
      options: [
        {
          text: 'The changes you have already staged with git add',
          whyWrong:
            'That is `git diff --staged`. Plain `git diff` deliberately shows the opposite side: the edits that have not been staged yet.',
        },
        {
          text: 'The changes you have made but not staged yet',
        },
        {
          text: 'A list of your recent commits and their messages',
          whyWrong:
            'That is `git log`. `git diff` never shows commit history, only the actual changed lines inside your files.',
        },
        {
          text: 'Every change since your last commit, staged or not',
          whyWrong:
            'Close, but plain `git diff` leaves out anything you have already staged. To see the staged half you have to run `git diff --staged` as well.',
        },
      ],
      correctIndex: 1,
      explanation:
        'Git keeps the two halves separate on purpose: `git diff` is the "what have I touched since I last staged" view, so you can review new edits without the staged ones getting in the way.',
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
            'Choose which files go into your next snapshot with `git add`',
            'Save that snapshot with `git commit -m`',
            'Write a commit message that still makes sense to you six months later',
            'See exactly which lines changed, staged or not, with `git diff`',
            'Read your project history back with `git log`',
            'Escape Vim if a commit ever drops you into it',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git add .                # stage everything in this folder\ngit add -A               # stage everything in the whole project\ngit commit -m "..."      # save a snapshot with a message\ngit diff                 # changed but not staged yet\ngit diff --staged        # staged and ready for the next commit\ngit log                  # full history\ngit log --oneline        # one line per commit',
        },
        {
          type: 'text',
          value:
            'Next up: every commit you have made so far lives only on your own computer. In the next lesson you connect your project to GitHub, so it is backed up and other people can see it.',
        },
      ],
    },
  ],
} satisfies Lesson
