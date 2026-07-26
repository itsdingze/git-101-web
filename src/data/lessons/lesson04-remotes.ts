import type { Lesson } from '@/types'
export default {
  id: 4,
  title: 'Remotes & GitHub',
  description: 'Connect your local repo to the cloud',
  steps: [
    {
      type: 'reading',
      id: 'why-remotes',
      title: 'Time to Go Online!',
      content: [
        {
          type: 'text',
          value:
            "You've been working locally — creating commits and tracking changes. Now let's put your code on **GitHub** so it's backed up, shareable, and part of your portfolio.",
        },
        {
          type: 'text',
          value:
            "Pushing your code to GitHub is one of the most satisfying milestones in learning Git. You only need `init`, `add`, and `commit` knowledge to do it — so let's get started!",
        },
      ],
    },
    {
      type: 'reading',
      id: 'remotes-concept',
      title: 'What Are Remotes?',
      content: [
        {
          type: 'text',
          value:
            'A **remote** is a version of your repository hosted on a server (like GitHub, GitLab, or Bitbucket). It allows you to collaborate with others and back up your work.',
        },
        {
          type: 'text',
          value:
            'Think of a remote as the shared copy that keeps everyone in sync — each person works on their own local copy, and the remote is where they share their changes.',
        },
        {
          type: 'text',
          value:
            'By convention, the main remote is called **`origin`**. When you connect your local repo to GitHub, Git uses this name by default.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git remote -v                  # List all remotes with their URLs\ngit remote add origin <url>    # Add a new remote called "origin"',
        },
      ],
    },
    {
      type: 'reading',
      id: 'github-setup',
      title: 'Pushing Your First Repo to GitHub',
      content: [
        {
          type: 'text',
          value:
            'Here is the step-by-step workflow to get your local project onto GitHub:',
        },
        {
          type: 'text',
          value:
            '1. **Create a new repository on GitHub** — Click the "+" button on GitHub and choose "New repository." Give it a name, leave it empty (no README, no .gitignore), and click "Create."\n2. **Connect your local repo** — Copy the URL GitHub gives you, then run:\n3. **Push your commits** — Upload your local history to GitHub.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Step 2: Connect to GitHub\ngit remote add origin https://github.com/your-username/your-repo.git\n\n# Step 3: Push your code\ngit push -u origin main',
        },
        {
          type: 'text',
          value:
            'The `-u` flag sets up **tracking** so future pushes and pulls just need `git push` and `git pull` — no extra arguments. Refresh your GitHub page and you should see your code!',
        },
        {
          type: 'text',
          value:
            "**Tip:** If your commits on GitHub show up as an unknown user, your `git config user.email` probably doesn't match any email on your GitHub account. Go to **GitHub Settings > Emails** and add the email you used in Git. GitHub will retroactively link those commits to your profile.",
        },
      ],
    },
    {
      type: 'reading',
      id: 'authentication',
      title: 'Authentication: HTTPS vs. SSH',
      content: [
        {
          type: 'text',
          value:
            'When you push to or clone from a private remote, Git needs to verify your identity. There are two common ways to authenticate:',
        },
        {
          type: 'text',
          value:
            '**HTTPS** — The simplest option. Git asks for your username and a **personal access token** (not your regular password). You create the token in your GitHub account settings.',
        },
        {
          type: 'text',
          value:
            '**SSH** — Uses a key pair on your machine for silent authentication. It takes more setup but is more convenient long-term. SSH URLs look like `git@github.com:user/repo.git` instead of `https://...`.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# HTTPS URL (uses token for auth):\ngit clone https://github.com/user/repo.git\n\n# SSH URL (uses SSH key for auth):\ngit clone git@github.com:user/repo.git',
        },
        {
          type: 'text',
          value:
            'For beginners, we recommend HTTPS or the GitHub CLI (next section). You can always switch to SSH later.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'gh-cli',
      title: 'The Easy Way: GitHub CLI',
      content: [
        {
          type: 'text',
          value:
            'The [GitHub CLI](https://cli.github.com) (`gh`) is an official tool that simplifies authentication and many GitHub operations. Instead of setting up tokens or SSH keys manually, you can authenticate with a single command:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Install GitHub CLI:\n# macOS:   brew install gh\n# Windows: winget install --id GitHub.cli\n# Linux:   See https://cli.github.com\n\n# Authenticate with GitHub:\ngh auth login\n# Follow the prompts — it opens a browser to log you in.',
        },
        {
          type: 'text',
          value:
            'Once authenticated, `gh` handles credentials for all future Git operations automatically.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'clone-push-pull',
      title: 'Clone, Push, and Pull',
      content: [
        {
          type: 'text',
          value:
            'Three essential commands for working with remotes:',
        },
        {
          type: 'text',
          value:
            '- **`git clone <url>`** — Download a remote repository to your machine. This creates a local copy with full history.\n- **`git push`** — Upload your local commits to the remote.\n- **`git pull`** — Download new commits from the remote and combine them with your current branch.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git clone https://github.com/user/repo.git   # Clone a repo\ngit push origin main                           # Push to main branch on origin\ngit pull origin main                           # Pull latest changes from main',
        },
      ],
    },
    {
      type: 'reading',
      id: 'fetch-vs-pull',
      title: 'Fetch vs. Pull',
      content: [
        {
          type: 'text',
          value:
            '`git pull` actually does two things: it **fetches** new commits from the remote, then **combines** them with your current branch. You can separate these steps if you want to review changes before combining them:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git fetch origin           # Download new commits but do NOT combine\ngit log origin/main        # See what changed on the remote\ngit pull origin main       # Combine when you are ready (fetch + merge in one step)',
        },
        {
          type: 'text',
          value:
            '`git fetch` is always safe — it never changes your working directory or current branch. It just updates your local knowledge of what the remote looks like. Use it when you want to check for updates without modifying your code.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'pull-divergent',
      title: 'A Pull Error You Will Probably Hit',
      content: [
        {
          type: 'text',
          value:
            'Sooner or later `git pull` will stop and show you this:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'fatal: Need to specify how to reconcile divergent branches.',
        },
        {
          type: 'text',
          value:
            'This is not a bug and nothing is broken. It means you and the remote both have new commits, so Git wants to know how you would like to combine them — and modern Git refuses to guess.',
        },
        {
          type: 'text',
          value:
            'Pick one and set it once. **Merge** is the safer default while you are learning, because it never rewrites history:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Combine with a merge commit (recommended to start):\ngit config --global pull.rebase false\n\n# Or replay your commits on top for a linear history:\ngit config --global pull.rebase true',
        },
        {
          type: 'text',
          value:
            'You only have to do this once per machine. We cover what rebasing actually does in the last lesson.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'upstream-tracking',
      title: 'Upstream Tracking',
      content: [
        {
          type: 'text',
          value:
            'When you push a branch for the first time, use the `-u` flag (short for `--set-upstream`) to link your local branch to its remote counterpart:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# First push — set up tracking:\ngit push -u origin feature-login\n\n# After that, just use:\ngit push\ngit pull',
        },
        {
          type: 'text',
          value:
            'Once tracking is set up, Git knows where to push and pull without you specifying the remote and branch every time. You can check which branches are tracking which remotes with `git branch -vv`.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-push',
      prompt: 'Build the command to push your commits to the main branch on origin:',
      availableBlocks: ['git', 'push', 'pull', 'origin', 'main', 'remote', 'clone', '-u'],
      correctAnswer: ['git', 'push', 'origin', 'main'],
      hints: [
        'You need four blocks: git, the action, the remote name, and the branch',
        'The remote is called "origin"',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'clone-repo',
      prompt: 'Clone the repository at "https://github.com/user/repo.git" to your machine:',
      expectedCommand: 'git clone https://github.com/user/repo.git',
      acceptableVariants: [],
      successOutput:
        "Cloning into 'repo'...\nremote: Enumerating objects: 42, done.\nremote: Total 42 (delta 0), reused 0 (delta 0)\nReceiving objects: 100% (42/42), done.",
      hints: [
        'Use git clone followed by the full URL',
        'The URL ends with .git',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-origin',
      question: 'What is "origin" in Git?',
      options: [
        'The default name for the remote repository you cloned from',
        'The first commit in the repository',
        'The main branch of the repository',
        'The local copy of the repository',
      ],
      correctIndex: 0,
      explanation:
        '"origin" is simply the default name Git gives to the remote repository when you clone it. It is a shorthand alias for the remote URL. You can rename it or add other remotes with different names.',
    },
  ],
} satisfies Lesson
