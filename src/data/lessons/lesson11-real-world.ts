import type { Lesson } from '@/types'
export default {
  id: 11,
  title: 'Real-World Workflow',
  description: 'Put it all together with a professional Git workflow',
  steps: [
    {
      type: 'reading',
      id: 'feature-branch-workflow',
      title: 'The Feature Branch Workflow',
      content: [
        {
          type: 'text',
          value:
            'In professional teams, the **feature branch workflow** is the most common way to use Git. The `main` branch always stays stable, and every new feature or fix gets its own branch.',
        },
        {
          type: 'text',
          value:
            'The typical flow looks like this:\n\n1. Pull the latest `main` to make sure you are up to date.\n2. Create a new branch with a descriptive name (e.g., `feature/add-auth`).\n3. Make commits on your feature branch.\n4. Push your branch to the remote.\n5. Open a **Pull Request** for code review.\n6. After approval, merge into `main` and delete the branch.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch main\ngit pull origin main\ngit switch -c feature/add-auth\n# ... make changes and commit ...\ngit push -u origin feature/add-auth',
        },
      ],
    },
    {
      type: 'workflow-exercise',
      id: 'feature-branch-workflow-practice',
      title: 'Practice: Feature Branch Workflow',
      scenario:
        'You are adding a search feature to a team project. Walk through the standard feature branch workflow step by step.',
      steps: [
        {
          narration: 'First, make sure you are on the main branch and have the latest changes from the remote.',
          expectedCommand: 'git pull origin main',
          acceptableVariants: ['git pull'],
          successOutput: 'Already up to date.',
          hints: ['Pull the latest changes from the remote main branch'],
        },
        {
          narration: 'Now create a branch called `feature/add-search` and switch to it.',
          expectedCommand: 'git switch -c feature/add-search',
          acceptableVariants: ['git checkout -b feature/add-search'],
          successOutput: "Switched to a new branch 'feature/add-search'",
          hints: [
            'Use git switch -c to create and switch in one step',
            'The branch name should be feature/add-search',
          ],
        },
        {
          narration: 'You have implemented the search bar component. Stage all your changes.',
          expectedCommand: 'git add .',
          acceptableVariants: ['git add -A', 'git add --all'],
          successOutput: '',
          hints: ['Stage all changes with git add'],
        },
        {
          narration: 'Commit your staged changes with a descriptive message (e.g. `git commit -m "feat: add search bar"`).',
          expectedCommand: 'git commit -m "feat: add search bar component"',
          acceptPrefix: 'git commit -m',
          successOutput:
            '[feature/add-search a1b2c3d] feat: add search bar component\n 3 files changed, 42 insertions(+)',
          hints: ['Use git commit -m with a message describing what you built'],
        },
        {
          narration: 'Push your branch to the remote with `git push -u origin feature/add-search`. The `-u` flag sets up tracking so future pushes are simpler.',
          expectedCommand: 'git push -u origin feature/add-search',
          acceptableVariants: ['git push --set-upstream origin feature/add-search'],
          successOutput:
            "Branch 'feature/add-search' set up to track remote branch 'feature/add-search' from 'origin'.",
          hints: [
            'Use -u flag to set up tracking',
            'The remote is origin and branch is feature/add-search',
          ],
        },
      ],
      completionMessage: "You've practiced the full feature branch workflow — pull, branch, stage, commit, push.",
    },
    {
      type: 'reading',
      id: 'fork-workflow',
      title: 'The Fork Workflow',
      content: [
        {
          type: 'text',
          value:
            'When contributing to open-source projects, you usually do not have write access to the main repository. Instead, you use the **fork workflow**:',
        },
        {
          type: 'text',
          value:
            '1. **Fork** the repository on GitHub — this creates your own copy under your account.\n2. **Clone your fork** to your machine.\n3. **Add the original repo as "upstream"** — so you can keep your fork in sync.\n4. **Create a branch, make changes, push to your fork**, and open a PR against the original repo.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Clone your fork:\ngit clone https://github.com/your-username/project.git\ncd project    # Enter the cloned folder\n\n# Add the original repo as "upstream":\ngit remote add upstream https://github.com/original-owner/project.git\n\n# Keep your fork in sync:\ngit fetch upstream\ngit merge upstream/main',
        },
        {
          type: 'text',
          value:
            'The key difference from the feature branch workflow: you push to **your fork**, not the original repo. The Pull Request bridges the two.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'pr-workflow',
      title: 'Pull Requests and Code Review',
      content: [
        {
          type: 'text',
          value:
            'A **Pull Request (PR)** is a request to merge your feature branch into another branch (usually `main`). It is created on platforms like GitHub, GitLab, or Bitbucket — not through Git itself.',
        },
        {
          type: 'text',
          value:
            'Pull Requests serve several purposes:\n\n- **Code review** — Teammates can review your changes, leave comments, and suggest improvements.\n- **Discussion** — The PR becomes a record of why changes were made.\n- **History** — The PR links the feature branch, commits, and discussion together.',
        },
        {
          type: 'text',
          value:
            'A good PR has a clear title, a description of what changed and why, and small, focused changes that are easy to review.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'ci-cd-intro',
      title: 'CI/CD: Automated Testing',
      content: [
        {
          type: 'text',
          value:
            'Many teams use **CI/CD** (Continuous Integration / Continuous Deployment) tools like [GitHub Actions](https://github.com/features/actions) to automatically run tests whenever code is pushed or a PR is opened. This catches bugs before they reach `main`.',
        },
        {
          type: 'text',
          value:
            'You\'ll encounter CI/CD on most professional projects. Configuring it is beyond this course, but it\'s good to know it exists — if you see a green checkmark or red X on a pull request, that\'s CI running tests automatically.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'rebase-intro',
      title: 'Rebase: A Cleaner History',
      content: [
        {
          type: 'text',
          value:
            '**Rebase** is an alternative to merge for integrating changes from one branch into another. Instead of creating a merge commit, rebase **replays** your commits on top of the target branch, creating a linear history.',
        },
        {
          type: 'text',
          value:
            'The result is the same code, but the commit history looks linear instead of branched. Some teams prefer this for a cleaner `git log`.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# While on your feature branch:\ngit rebase main\n\n# This replays your feature commits on top of main\'s latest commit.',
        },
        {
          type: 'text',
          value:
            '**Important rule:** Never rebase commits that have been pushed to a shared branch. Rebase rewrites commit history (changes hashes), which causes problems for collaborators.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'rebase',
    },
    {
      type: 'reading',
      id: 'staying-up-to-date',
      title: 'Keeping Your Branch Up to Date',
      content: [
        {
          type: 'text',
          value:
            'While you work on a feature branch, other people may merge changes into `main`. If your branch falls behind, you should update it to avoid big merge conflicts later:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Option 1: Merge main into your branch (preserves history)\ngit switch feature/add-auth\ngit pull origin main\n\n# Option 2: Rebase onto main (linear history)\ngit switch feature/add-auth\ngit fetch origin\ngit rebase origin/main',
        },
        {
          type: 'text',
          value:
            'Do this regularly — especially before opening a pull request. It is much easier to resolve small conflicts as they come up than one massive conflict at the end.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'tags-intro',
      title: 'Tags: Marking Releases',
      content: [
        {
          type: 'text',
          value:
            '**Tags** are permanent bookmarks for specific commits, most commonly used to mark release versions like `v1.0`, `v2.3.1`, etc. Unlike branches, tags do not move when new commits are made.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Create a tag for a release:\ngit tag -a v1.0 -m "Release 1.0"\n\n# List all tags:\ngit tag\n\n# Push tags to remote:\ngit push origin --tags',
        },
      ],
    },
    {
      type: 'reading',
      id: 'useful-commands',
      title: 'Investigating History',
      content: [
        {
          type: 'text',
          value:
            '**`git blame <file>`** shows who last modified each line of a file and in which commit. Useful for understanding why a line of code exists and who to ask about it.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git blame src/app.js',
        },
      ],
    },
    {
      type: 'reading',
      id: 'best-practices',
      title: 'Git Best Practices',
      content: [
        {
          type: 'text',
          value:
            'Here are some habits that professional developers follow:',
        },
        {
          type: 'text',
          value:
            '- **Commit often** — Small, focused commits are easier to review and revert.\n- **Pull before you push** — Always `git pull` before `git push` to avoid conflicts.\n- **Never commit secrets** — Use `.gitignore` for API keys, passwords, and tokens.\n- **Use branches** — Never commit directly to `main` in a team project.\n- **Review diffs before committing** — Use `git diff --staged` to review what you\'re about to commit.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-switch-feature',
      prompt: 'Build the command to create and switch to a new feature branch called "feature/add-auth":',
      availableBlocks: ['git', 'switch', '-c', 'branch', 'feature/add-auth', 'checkout', '-b', 'main'],
      correctAnswer: ['git', 'switch', '-c', 'feature/add-auth'],
      acceptableAnswers: [['git', 'checkout', '-b', 'feature/add-auth']],
      hints: [
        'Use git switch with the -c flag to create and switch in one step',
        'The branch name follows the -c flag',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'push-feature-branch',
      prompt: 'Push your feature/add-auth branch to the remote and set up tracking:',
      expectedCommand: 'git push -u origin feature/add-auth',
      acceptableVariants: [
        'git push --set-upstream origin feature/add-auth',
      ],
      successOutput:
        "Branch 'feature/add-auth' set up to track remote branch 'feature/add-auth' from 'origin'.\nTo https://github.com/user/repo.git\n * [new branch]      feature/add-auth -> feature/add-auth",
      hints: [
        'Use -u or --set-upstream to set up tracking',
        'The remote is "origin" and the branch is "feature/add-auth"',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-best-practices',
      question: 'Why should you never commit directly to the main branch in a team project?',
      options: [
        'It bypasses code review and can introduce bugs into the stable branch',
        'Git does not allow commits on the main branch',
        'Main branch commits are slower than feature branch commits',
        'It uses more disk space',
      ],
      correctIndex: 0,
      explanation:
        'Committing directly to main skips the code review process, which means bugs and issues can reach the stable branch without anyone catching them. Using feature branches and pull requests ensures quality through peer review.',
    },
  ],
} satisfies Lesson
