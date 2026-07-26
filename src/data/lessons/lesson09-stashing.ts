import type { Lesson } from '@/types'
export default {
  id: 9,
  title: 'Stashing',
  description: 'Temporarily shelve changes for later',
  steps: [
    {
      type: 'reading',
      id: 'when-to-stash',
      title: 'When to Use Stash',
      content: [
        {
          type: 'text',
          value:
            'Sometimes you\'re in the middle of work when you need to switch branches — maybe to fix an urgent bug. You\'re not ready to commit your half-finished changes, but Git may block you from switching branches when you have uncommitted edits.',
        },
        {
          type: 'text',
          value:
            '`git stash` saves your uncommitted changes (both staged and unstaged) and reverts your working directory to match the last commit. Later, you can restore those changes and continue where you left off.',
        },
        {
          type: 'text',
          value:
            '**Note:** By default, `git stash` only saves changes to tracked files. Brand-new untracked files are left behind. You can include them with `git stash -u`.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash        # Save changes and clean the working directory\ngit stash pop    # Restore the most recent stash and remove it from the stash list',
        },
        {
          type: 'text',
          value:
            'If `git stash pop` causes a conflict, resolve it the same way you learned in the previous lesson.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'stash-commands',
      title: 'Managing Your Stashes',
      content: [
        {
          type: 'text',
          value:
            'You can have multiple stashes. Git stores them in a list — the most recent stash is always first:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash list              # List all stashed changes\ngit stash apply             # Restore the latest stash but keep it in the list\ngit stash pop               # Apply + drop in one step',
        },
        {
          type: 'text',
          value:
            'You can also give your stash a description to remember what it contains:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git stash push -m "half-finished navbar styling"',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-stash',
      prompt: 'Build the command to save your current changes to the stash:',
      availableBlocks: ['git', 'stash', 'push', 'pop', 'save', 'add', 'commit'],
      correctAnswer: ['git', 'stash'],
      acceptableAnswers: [['git', 'stash', 'push']],
      hints: [
        'You only need two blocks',
        'The simplest form of the command is just git stash',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'stash-pop',
      prompt: 'Restore your most recently stashed changes and remove them from the stash list:',
      expectedCommand: 'git stash pop',
      // Not `apply` — the prompt asks for removal from the list, which is the
      // exact distinction the quiz right after this one tests.
      acceptableVariants: [],
      successOutput:
        'On branch main\nChanges not staged for commit:\n  modified:   navbar.css\n\nDropped refs/stash@{0} (a1b2c3d4e5f6)',
      hints: [
        'Use git stash with a subcommand that restores and removes',
        'pop = apply + drop',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-stash',
      question: 'What is the difference between "git stash pop" and "git stash apply"?',
      options: [
        'pop restores and removes the stash; apply restores but keeps it in the stash list',
        'pop saves changes; apply restores them',
        'There is no difference',
        'pop removes the stash without applying; apply restores it',
      ],
      correctIndex: 0,
      explanation:
        'git stash pop applies the stash and then removes it from the stash list. git stash apply restores the changes but keeps the stash entry, so you can apply it again later if needed.',
    },
  ],
} satisfies Lesson
