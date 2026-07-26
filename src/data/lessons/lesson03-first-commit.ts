import type { Lesson } from '@/types'
export default {
  id: 3,
  title: 'Your First Commit',
  description: 'Stage files, write good commit messages, and view history',
  steps: [
    {
      type: 'reading',
      id: 'staging-files',
      title: 'Staging Files',
      content: [
        {
          type: 'text',
          value:
            'Before committing, you need to **stage** your changes. This tells Git which files to include in the next commit:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git add filename.txt    # Stage a specific file\ngit add .               # Stage all changes in the current directory',
        },
        {
          type: 'text',
          value:
            'Staging lets you commit only some changes while keeping others as work-in-progress.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-add',
      prompt: 'Build the command to stage ALL changed files:',
      availableBlocks: ['git', 'add', 'commit', '.', '-m', '-A', 'stage'],
      correctAnswer: ['git', 'add', '.'],
      acceptableAnswers: [['git', 'add', '-A']],
      hints: ['Start with "git add"', 'Use a dot to mean "everything"'],
    },
    {
      type: 'reading',
      id: 'committing',
      title: 'Making a Commit',
      content: [
        {
          type: 'text',
          value:
            'A **commit** is a snapshot of your staged changes. Every commit needs a message describing what changed:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git commit -m "Initial commit"',
        },
        {
          type: 'text',
          value:
            'The `-m` flag lets you write the message inline. Without it, Git opens a text editor for you to type a longer message.',
        },
        {
          type: 'text',
          value:
            '**Heads up:** The default editor is often **Vim**, which can be confusing if you have never used it. If you find yourself stuck in a terminal that won\'t let you type normally — press `Esc`, then type `:wq` and press `Enter` to save and exit. To avoid this entirely, you can set a friendlier editor:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Use VS Code as your Git editor:\ngit config --global core.editor "code --wait"\n\n# Or use nano (simpler terminal editor):\ngit config --global core.editor "nano"',
        },
      ],
    },
    {
      type: 'reading',
      id: 'commit-messages',
      title: 'Writing Good Commit Messages',
      content: [
        {
          type: 'text',
          value:
            'Good commit messages make your project history useful. Here are the key conventions most teams follow:',
        },
        {
          type: 'text',
          value:
            '- **Use imperative mood** — Write "Add feature" not "Added feature." Think of it as completing the sentence: "If applied, this commit will *add feature*."\n- **Keep the subject line under 50 characters** — Short and scannable.\n- **Add a body after a blank line** — If the change needs explanation, leave a blank line after the subject, then write the details.',
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
            'Some teams use a format called **[Conventional Commits](https://www.conventionalcommits.org)**: `feat: add auth`, `fix: resolve login bug`, `docs: update README`. The prefix makes history easier to scan.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-commit',
      prompt: 'Make a commit with the message "Initial commit":',
      expectedCommand: 'git commit -m "Initial commit"',
      acceptableVariants: [
        "git commit -m 'Initial commit'",
        'git commit -m "initial commit"',
      ],
      successOutput:
        '[main (root-commit) a1b2c3d] Initial commit\n 1 file changed, 1 insertion(+)',
      hints: ['Use -m flag followed by your message in quotes'],
    },
    {
      type: 'reading',
      id: 'git-diff',
      title: 'Viewing Changes with git diff',
      visualization: 'diff-walkthrough',
      content: [
        {
          type: 'text',
          value: '`git diff` shows you exactly what changed in your files, line by line:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git diff              # Changes not yet staged\ngit diff --staged     # Changes staged for next commit',
        },
        {
          type: 'text',
          value: 'Lines prefixed with `+` were added, lines with `-` were removed. This is essential for reviewing your work before committing.',
        },
        {
          type: 'text',
          value:
            'You may also see `git diff --cached` in older tutorials — it does exactly the same thing as `--staged`. Both work; `--staged` is the clearer name.',
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
      title: 'Viewing History with git log',
      content: [
        {
          type: 'text',
          value: '`git log` shows the commit history of your repository:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git log                    # Full log\ngit log --oneline          # Compact one-line format',
        },
        {
          type: 'text',
          value: 'Each commit shows its hash (a unique ID), author, date, and message. The `--oneline` flag gives you a cleaner overview.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-log',
      prompt: 'View the commit history in compact one-line format:',
      expectedCommand: 'git log --oneline',
      acceptableVariants: [],
      successOutput: 'a1b2c3d Initial commit\nf4e5d6c Add README',
      hints: ['Use git log with the --oneline flag'],
    },
    {
      type: 'reading',
      id: 'log-filtering',
      title: 'Filtering History',
      content: [
        {
          type: 'text',
          value:
            'As your project grows, `git log` can get very long. Here are a few useful filters:',
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
            'You don\'t need to memorize these — just know they exist so you can look them up when needed.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-staging',
      question:
        'What is the correct order of operations for your first commit?',
      options: [
        'git init → git add → git commit',
        'git commit → git add → git init',
        'git add → git init → git commit',
        'git init → git commit → git add',
      ],
      correctIndex: 0,
      explanation:
        'First initialize the repo (init), then stage files (add), then commit them.',
    },
    {
      type: 'quiz',
      id: 'quiz-diff',
      question: 'What does `git diff` (with no flags) show you?',
      options: [
        'Changes not yet staged',
        'Changes already staged',
        'All changes since last commit',
        'Differences between branches',
      ],
      correctIndex: 0,
      explanation: 'Plain `git diff` shows unstaged changes — modifications in your working directory that haven\'t been added to the staging area yet.',
    },
  ],
} satisfies Lesson
