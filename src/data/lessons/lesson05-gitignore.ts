import type { Lesson } from '@/types'
export default {
  id: 5,
  title: '.gitignore',
  description: 'Tell Git which files to ignore',
  steps: [
    {
      type: 'reading',
      id: 'why-gitignore',
      title: 'Why Ignore Files?',
      content: [
        {
          type: 'text',
          value:
            'Not every file should be tracked by Git. Some files are generated automatically, contain secrets, or are machine-specific — committing them would clutter your history and cause problems for collaborators.',
        },
        {
          type: 'text',
          value:
            'Common files you should **not** commit:\n- **Dependencies** — `node_modules/` (installed by your package manager, can be reinstalled)\n- **Environment files** — `.env` (contains passwords and API keys)\n- **OS junk** — `.DS_Store` (macOS), `Thumbs.db` (Windows)\n\nThere are many more (build output, editor settings, etc.) — we\'ll show you how to find templates that cover these automatically.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'creating-gitignore',
      title: 'Creating a .gitignore File',
      content: [
        {
          type: 'text',
          value:
            'A `.gitignore` file tells Git which files and directories to ignore. Create it in the **root of your repository** and list one pattern per line:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n\n# Environment variables\n.env\n.env.local\n\n# OS files\n.DS_Store\nThumbs.db\n\n# Editor settings\n.idea/\n*.swp',
        },
        {
          type: 'text',
          value:
            'Lines starting with `#` are comments. Git reads this file and skips any matching files when staging — they will not show up in `git status` and cannot be accidentally committed.',
        },
        {
          type: 'text',
          value:
            '**Important:** The `.gitignore` file itself **should be committed** to the repository. This ensures everyone on the team uses the same ignore rules. It is one of the first files you should add and commit when starting a project.',
        },
        {
          type: 'text',
          value:
            '**Tip:** Git doesn\'t track empty directories. If you need one in your repo, add an empty file called `.gitkeep` inside it — it\'s just a convention, not a Git feature.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'gitignore-patterns',
      title: 'Pattern Syntax',
      content: [
        {
          type: 'text',
          value:
            'The most common `.gitignore` patterns:',
        },
        {
          type: 'text',
          value:
            '- `*.log` — The `*` wildcard matches any characters, so this ignores all `.log` files\n- `build/` — A trailing slash ignores a directory and everything inside it\n- `!important.log` — The `!` prefix negates a pattern — this file is tracked even if `*.log` is ignored',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '# Ignore all .log files\n*.log\n\n# But keep error.log\n!error.log\n\n# Ignore the build directory\nbuild/',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-gitignore-pattern',
      question: 'What does the pattern `*.log` do in a .gitignore file?',
      options: [
        'Ignores all files ending in .log',
        'Tracks all .log files',
        'Deletes all .log files',
        'Ignores only files named "log"',
      ],
      correctIndex: 0,
      explanation:
        'The `*` wildcard matches any characters, so `*.log` matches every file that ends with `.log` and tells Git to ignore them all.',
    },
    {
      type: 'reading',
      id: 'already-tracked',
      title: 'Ignoring Already-Tracked Files',
      content: [
        {
          type: 'text',
          value:
            'You may not need this right away, but here is how to handle it when it comes up: adding a file to `.gitignore` only prevents **future** tracking. If a file is already tracked by Git, adding it to `.gitignore` will not remove it. You need to explicitly untrack it first:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Stop tracking a file but keep it on disk:\ngit rm --cached .env\n\n# Stop tracking an entire directory:\ngit rm -r --cached node_modules/\n\n# Then commit the removal:\ngit commit -m "Remove tracked files that should be ignored"',
        },
        {
          type: 'text',
          value:
            'The `--cached` flag is important — it removes the file from Git\'s tracking (the staging area) without deleting it from your working directory. Without `--cached`, `git rm` would delete the file from disk too.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-rm-cached',
      prompt: 'Build the command to stop tracking ".env" without deleting it from disk:',
      availableBlocks: ['git', 'rm', 'add', '--cached', '--staged', '.env', '-r', 'restore'],
      correctAnswer: ['git', 'rm', '--cached', '.env'],
      hints: [
        'Use git rm with a flag that only affects the index',
        'The --cached flag removes from tracking without deleting the file',
      ],
    },
    {
      type: 'reading',
      id: 'gitignore-templates',
      title: 'Using Templates',
      content: [
        {
          type: 'text',
          value:
            'You don\'t have to write a `.gitignore` from scratch. Most developers start from an existing template and modify it to fit their project. Two popular sources:',
        },
        {
          type: 'text',
          value:
            '- **GitHub\'s gitignore templates** — When you create a new repo on GitHub, it offers to add a `.gitignore` for your language/framework. You can also browse the full collection at [github/gitignore](https://github.com/github/gitignore).\n- **gitignore.io** — The site [gitignore.io](https://www.toptal.com/developers/gitignore) lets you type in your OS, editor, and language, and it generates a comprehensive `.gitignore` for you.',
        },
        {
          type: 'text',
          value:
            'Starting from a template is the recommended approach. It covers edge cases you might not think of, and you can always add or remove lines to match your specific project.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'global-gitignore',
      title: 'Advanced Tip: Global .gitignore',
      content: [
        {
          type: 'text',
          value:
            'Some ignore rules apply to every project on your machine — like `.DS_Store` on macOS or editor-specific files. Instead of adding these to every project, you can set up a **global** `.gitignore`:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Create a global gitignore file:\ngit config --global core.excludesFile ~/.gitignore_global',
        },
        {
          type: 'text',
          value:
            'Then add your machine-specific patterns to `~/.gitignore_global`. This keeps your project\'s `.gitignore` focused on project-specific rules, and your personal preferences stay out of the shared repo.',
        },
        {
          type: 'text',
          value:
            'Want to see which files Git is actually ignoring? Add the `--ignored` flag to `git status`:\n\n`git status --ignored`\n\nThis is handy for verifying your `.gitignore` rules are working as expected.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'check-ignored',
      prompt: 'Check which files Git is currently ignoring in your repository:',
      expectedCommand: 'git status --ignored',
      acceptableVariants: ['git status --ignored --short'],
      successOutput:
        'On branch main\nIgnored files:\n  (use "git add -f <file>..." to include in what will be committed)\n\tnode_modules/\n\t.env\n\t.DS_Store',
      hints: [
        'Use git status with a flag to show ignored files',
        'The flag is --ignored',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-already-tracked',
      question: 'You committed `.env` before adding it to `.gitignore`. What happens now?',
      options: [
        'Git keeps tracking .env — you must run `git rm --cached .env` to untrack it',
        '.gitignore automatically untracks the file',
        'Git deletes the .env file from disk',
        'The .env file is hidden from git log',
      ],
      correctIndex: 0,
      explanation:
        '.gitignore only prevents untracked files from being added. Once a file is tracked, Git keeps tracking it regardless of .gitignore. You need `git rm --cached` to explicitly untrack it.',
    },
  ],
} satisfies Lesson
