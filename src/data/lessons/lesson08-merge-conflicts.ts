import type { Lesson } from '@/types'
export default {
  id: 8,
  title: 'Merge Conflicts',
  description: 'Resolve conflicts when branches collide',
  steps: [
    {
      type: 'reading',
      id: 'why-conflicts',
      title: 'Why Do Conflicts Happen?',
      content: [
        {
          type: 'text',
          value:
            'A **merge conflict** occurs when two branches modify the **same lines** in the same file. For example, if one branch changes line 10 to say `Welcome!` while another changes it to say `Hello!`, Git can\'t pick one automatically — it stops and asks you to decide.',
        },
        {
          type: 'text',
          value:
            'Conflicts are a normal part of collaboration — not an error.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'conflict-markers',
      title: 'Reading Conflict Markers',
      visualization: 'conflict-markers',
      content: [
        {
          type: 'text',
          value:
            'When a conflict occurs, Git inserts **conflict markers** into the affected file:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '<<<<<<< HEAD\nWelcome to our website!\n=======\nWelcome to our amazing website!\n>>>>>>> feature-banner',
        },
        {
          type: 'text',
          value:
            '- Everything between `<<<<<<< HEAD` and `=======` is what **your current branch** has.\n- Everything between `=======` and `>>>>>>> feature-banner` is what the **incoming branch** has.\n- You must edit the file to keep the version you want (or combine both), then **remove all conflict markers**.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'resolution-workflow',
      title: 'Resolving Conflicts Step by Step',
      content: [
        {
          type: 'text',
          value:
            'Follow these steps to resolve a merge conflict:',
        },
        {
          type: 'text',
          value:
            '1. Run `git status` to see which files have conflicts — they will be listed as "both modified."\n2. **Open** each conflicted file and find the conflict markers.\n3. **Edit** the file — choose one side, combine both, or write something new.\n4. **Remove** all `<<<<<<<`, `=======`, and `>>>>>>>` markers.\n5. **Stage** each resolved file with `git add`.\n6. **Commit** to complete the merge.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# After editing the file to resolve conflicts:\ngit add resolved-file.txt\ngit commit -m "Resolve merge conflict in resolved-file.txt"',
        },
      ],
    },
    {
      type: 'reading',
      id: 'aborting-merge',
      title: 'Aborting a Merge',
      content: [
        {
          type: 'text',
          value:
            'If you start a merge and realize you\'re not ready to deal with the conflicts, you can abort and go back to the state before the merge:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git merge --abort',
        },
        {
          type: 'text',
          value:
            'This resets your working directory and staging area to the state before the merge. No changes are lost — your branches remain exactly as they were.',
        },
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-1',
      prompt: 'Resolve this merge conflict. The team decided to use the updated welcome message from the feature branch:',
      fileName: 'index.html',
      oursLabel: 'HEAD (main)',
      theirsLabel: 'feature-banner',
      oursContent: 'Welcome to our website!',
      theirsContent: 'Welcome to our amazing website!',
      surroundingBefore: '<body>\n  <header>',
      surroundingAfter: '  </header>\n</body>',
      acceptableResolutions: ['Welcome to our amazing website!'],
      hints: [
        'The team wants the feature branch version',
        'Click "Keep theirs" to use the incoming changes',
      ],
    },
    {
      type: 'conflict-exercise',
      id: 'resolve-conflict-2',
      prompt: 'Both developers added valid CSS imports. Resolve this conflict by keeping both lines:',
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
        'Both imports are needed — the project uses components and dark mode',
        'Click "Keep both" to include both lines',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'stage-resolved',
      prompt:
        'You have manually resolved the conflict in "resolved-file.txt". Stage it to mark it as resolved:',
      expectedCommand: 'git add resolved-file.txt',
      acceptableVariants: [],
      successOutput: '',
      hints: [
        'Use git add to mark the file as resolved',
        'The filename is resolved-file.txt',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-conflict-markers',
      question: 'What does the ======= marker separate in a merge conflict?',
      options: [
        "Your current branch's changes from the incoming branch's changes",
        'Staged changes from unstaged changes',
        'Old commits from new commits',
        'Local files from remote files',
      ],
      correctIndex: 0,
      explanation:
        "The ======= marker is the divider between your current branch's version (above) and the incoming branch's version (below) within the conflict block.",
    },
    {
      type: 'quiz',
      id: 'quiz-abort-merge',
      question:
        'You started merging feature-login into main, but Git reports a conflict in auth.js. You\'re not confident about the changes and want to back out safely. What should you run?',
      options: [
        '`git merge --abort`',
        '`git status`',
        '`git add auth.js`',
        '`git commit`',
      ],
      correctIndex: 0,
      explanation:
        '`git merge --abort` cancels the merge cleanly and puts both branches back to exactly where they were before. You can try again later when you\'re ready.',
    },
  ],
} satisfies Lesson
