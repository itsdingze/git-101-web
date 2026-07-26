import type { Lesson } from '@/types'
export default {
  id: 7,
  title: 'Merging',
  description: 'Combine branches together',
  steps: [
    {
      type: 'reading',
      id: 'merge-basics',
      title: 'What Is Merging?',
      content: [
        {
          type: 'text',
          value:
            '**Merging** is how you combine work from one branch into another. When your feature branch is done, you merge it back into `main`.',
        },
        {
          type: 'text',
          value:
            'If the branches changed different parts of the code, Git combines them automatically. If they changed the same lines, you get a **merge conflict** — we\'ll cover that in the next lesson.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# First, switch to the branch you want to merge INTO:\ngit switch main\n\n# Then merge the feature branch:\ngit merge feature-login',
        },
        {
          type: 'text',
          value:
            'The branch you\'re currently on receives the changes. The branch being merged is not modified.',
        },
        {
          type: 'text',
          value:
            '**Tip:** Git may refuse to merge if you have uncommitted changes that could conflict with the incoming changes. Commit or discard your uncommitted changes before merging to keep things clean.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'merging',
    },
    {
      type: 'reading',
      id: 'merge-types',
      title: 'Fast-Forward vs. Merge Commit',
      content: [
        {
          type: 'text',
          value:
            'Git uses two different merge strategies depending on the branch history:',
        },
        {
          type: 'text',
          value:
            '**Fast-forward** — If `main` has not changed since your branch was created, Git just moves the pointer forward. Simple and clean.\n\n**Merge commit** — If both branches have new commits, Git creates a special commit that ties the two histories together.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-merge',
      prompt: 'Build the command to merge the "feature" branch into your current branch:',
      availableBlocks: ['git', 'merge', 'checkout', 'feature', 'main', 'branch', '-b'],
      correctAnswer: ['git', 'merge', 'feature'],
      hints: [
        'You only need three blocks',
        'Make sure you are already on the branch you want to merge into',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'merge-branch',
      prompt: 'You are on the main branch. Merge the branch called "add-footer" into main:',
      expectedCommand: 'git merge add-footer',
      acceptableVariants: [],
      successOutput:
        "Merge made by the 'ort' strategy.\n footer.html | 12 ++++++++++++\n 1 file changed, 12 insertions(+)",
      hints: ['Use git merge followed by the branch name'],
    },
    {
      type: 'reading',
      id: 'after-merge',
      title: 'After the Merge',
      content: [
        {
          type: 'text',
          value:
            'Once a branch is merged, you can safely delete it to keep your branch list clean:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch -d add-footer   # Delete the merged branch\ngit log --oneline --graph  # View the merge history visually',
        },
        {
          type: 'text',
          value:
            'The `-d` flag only deletes branches that have been fully merged. Git protects you from accidentally losing unmerged work.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-merge-types',
      question: 'When does Git create a merge commit instead of a fast-forward?',
      options: [
        'When both branches have new commits since they diverged',
        'When the feature branch has no commits',
        'When you use the -m flag',
        'When merging into a remote branch',
      ],
      correctIndex: 0,
      explanation:
        'A merge commit is needed when both branches have diverged with new commits, so Git creates a special commit that ties the two histories together.',
    },
  ],
} satisfies Lesson
