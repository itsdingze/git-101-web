import type { Lesson } from '@/types'
export default {
  id: 6,
  title: 'Branching',
  description: 'Create and switch between parallel lines of development',
  steps: [
    {
      type: 'reading',
      id: 'what-are-branches',
      title: 'What Are Branches?',
      content: [
        {
          type: 'text',
          value:
            'A **branch** is a parallel line of development. It lets you work on something new — like a feature or a fix — in isolation, without affecting the `main` branch. When you\'re done, you can bring the changes back (we\'ll cover how in the next lesson).',
        },
        {
          type: 'text',
          value:
            "Branches are incredibly lightweight in Git — they're just pointers to a commit. Creating a branch is nearly instant.",
        },
        {
          type: 'text',
          value:
            'Git uses a special pointer called **HEAD** to track which branch you\'re currently on. When you switch branches, HEAD moves to the new branch — it always points at wherever you\'re working right now.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'branching',
    },
    {
      type: 'reading',
      id: 'creating-branches',
      title: 'Creating & Switching Branches',
      content: [
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch feature-login      # Create a new branch\ngit switch feature-login      # Switch to it\n\n# Or do both in one command:\ngit switch -c feature-login',
        },
        {
          type: 'text',
          value:
            'The `-c` flag (short for `--create`) creates the branch and switches to it in one step. Older tutorials use `git checkout -b` — it still works, but `git switch` is the modern replacement (introduced in Git 2.23).',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-switch-c',
      prompt: 'Build the command to create AND switch to a new branch called "feature":',
      availableBlocks: ['git', 'switch', '-c', 'branch', 'feature', 'checkout', '-b'],
      correctAnswer: ['git', 'switch', '-c', 'feature'],
      acceptableAnswers: [['git', 'checkout', '-b', 'feature']],
      hints: ['Use git switch with -c flag', 'The -c flag creates the branch before switching'],
    },
    {
      type: 'terminal-exercise',
      id: 'create-branch',
      prompt: 'Create and switch to a new branch called "add-navbar":',
      expectedCommand: 'git switch -c add-navbar',
      acceptableVariants: ['git checkout -b add-navbar'],
      successOutput: "Switched to a new branch 'add-navbar'",
      hints: ['Use git switch with -c to create and switch in one step'],
    },
    {
      type: 'reading',
      id: 'listing-branches',
      title: 'Listing & Deleting Branches',
      content: [
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch          # List all local branches\ngit branch -a       # List all branches (including remote)\ngit branch -d done  # Delete a branch you are done with',
        },
        {
          type: 'text',
          value:
            'The current branch is marked with an asterisk `*`. Clean up branches when you no longer need them to keep your repo tidy.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-branch',
      question: 'What is a Git branch, technically?',
      options: [
        'A lightweight pointer to a specific commit',
        'A complete copy of the entire repository',
        'A separate folder on your hard drive',
        'A tag that marks an important commit',
      ],
      correctIndex: 0,
      explanation:
        'A branch is just a movable pointer (reference) to a commit. This is why creating branches in Git is nearly instantaneous.',
    },
  ],
} satisfies Lesson
