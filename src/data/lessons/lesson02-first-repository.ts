import type { Lesson } from '@/types'
export default {
  id: 2,
  title: 'Your First Repository',
  description: 'Initialize a repo and understand file states',

  steps: [
    {
      type: 'reading',
      id: 'three-areas',
      title: 'The Three Areas of Git',
      content: [
        {
          type: 'text',
          value:
            'Git organizes your work into **three areas**. Understanding these is the key to mastering Git:',
        },
        {
          type: 'text',
          value:
            '1. **Working Directory** — Where you edit files normally\n2. **Staging Area** — A prep zone where you choose what goes into the next commit\n3. **Repository** (.git) — The permanent history of all your commits',
        },
        {
          type: 'text',
          value:
            "Think of it like packing a box to ship. Your desk is the Working Directory (messy, in-progress). You move finished items to a packing table (Staging Area). When everything's ready, you seal and label the box (Commit to Repository).",
        },
      ],
      visualization: 'three-place-model',
    },
    {
      type: 'reading',
      id: 'git-init',
      title: 'Initializing a Repository',
      content: [
        {
          type: 'text',
          value:
            'To start tracking a project with Git, navigate to the project folder in your terminal and run:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git init',
        },
        {
          type: 'text',
          value:
            'This creates a hidden `.git` folder that stores all of Git\'s data. Your project is now a Git repository!',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-init',
      prompt: 'Initialize a new Git repository:',
      expectedCommand: 'git init',
      acceptableVariants: [],
      successOutput:
        'Initialized empty Git repository in /home/user/my-project/.git/',
      hints: ['The command is two words: git + init'],
    },
    {
      type: 'reading',
      id: 'file-states',
      title: 'Understanding File States',
      content: [
        {
          type: 'text',
          value:
            'Before doing anything, check what Git knows about your files:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git status',
        },
        {
          type: 'text',
          value:
            '`git status` is your most-used command. It tells you the current state of your working directory and staging area. Files can be in one of four states:',
        },
        {
          type: 'text',
          value:
            '- **Untracked** — Git doesn\'t know about this file yet. New files start here.\n- **Modified** — Changed since last commit but not staged.\n- **Staged** — Ready to be committed. You moved it to the "packing table."\n- **Committed** — Safely stored in the repository.',
        },
        {
          type: 'text',
          value:
            'Right after `git init`, all your existing files will appear as **untracked** — Git sees them but isn\'t tracking changes yet. Think of `git status` as asking Git "what\'s going on right now?" You\'ll use it constantly.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-status',
      prompt: 'Check the status of your new repository:',
      expectedCommand: 'git status',
      acceptableVariants: ['git status --short', 'git status -s'],
      successOutput:
        'On branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tindex.html\n\tstyle.css\n\nnothing added to commit but untracked files present (use "git add" to track)',
      hints: ['The command is two words: git + status'],
    },
    {
      type: 'quiz',
      id: 'quiz-file-states',
      question: 'A file you just created but never ran `git add` on is in what state?',
      options: ['Untracked', 'Modified', 'Staged', 'Committed'],
      correctIndex: 0,
      explanation: 'New files that haven\'t been added to Git are "untracked" — Git sees them but isn\'t tracking changes to them yet.',
    },
    {
      type: 'reading',
      id: 'vscode-gui',
      title: 'VS Code Source Control',
      content: [
        {
          type: 'text',
          value:
            'If you use **VS Code**, it has a built-in **Source Control** panel (the branch icon in the sidebar, or `Ctrl+Shift+G` / `Cmd+Shift+G`). It shows you modified, staged, and untracked files with a visual interface — you can stage, unstage, and commit by clicking.',
        },
        {
          type: 'text',
          value:
            'The visual interface is convenient, but it\'s best to **learn the commands first**. Commands work everywhere — servers, other editors, automated tools — and understanding them helps you know what the buttons are actually doing. Once you\'re comfortable with the commands, feel free to use whichever interface you prefer.',
        },
        {
          type: 'text',
          value:
            "As you learn new commands, you can use the **Cheat Sheet** button in the top-right corner to quickly look them up. It tracks what you've learned so far.",
        },
      ],
    },
  ],
} satisfies Lesson
