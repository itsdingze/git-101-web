import type { Lesson } from '@/types'
export default {
  id: 1,
  title: 'Setting Up Git',
  description: 'Install Git and configure your identity',
  steps: [
    {
      type: 'reading',
      id: 'install-git',
      title: 'Installing Git',
      content: [
        {
          type: 'text',
          value:
            'There are two ways to install Git: **downloading the installer** from the official website, or using a **package manager**.',
        },
        {
          type: 'text',
          value:
            "A **package manager** is a command-line tool that installs, updates, and removes software for you — think of it as an app store you control by typing commands. You don't need one to install Git, but most developers prefer it: one command to install, one command to update, and your whole team can use the exact same setup.",
        },
        {
          type: 'text',
          value:
            '**macOS** — Git comes pre-installed on most Macs, but it\'s often outdated. The recommended way to install the latest version is through [Homebrew](https://brew.sh), the most popular package manager for macOS. If you don\'t have Homebrew yet, head to the [official website](https://brew.sh) for the installation guide.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'brew install git',
        },
        {
          type: 'text',
          value:
            '**Windows** — Download the installer from [git-scm.com](https://git-scm.com/download/win), which also includes Git Bash (a Unix-like terminal). Alternatively, you can use [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), the built-in package manager that comes with Windows 10 and 11 — no extra setup needed.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Option 1: Download installer from https://git-scm.com/download/win\n\n# Option 2: Install via winget\nwinget install --id Git.Git -e --source winget',
        },
        {
          type: 'text',
          value:
            "**Linux** — Use your distribution's built-in package manager:",
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Ubuntu / Debian\nsudo apt install git\n\n# Fedora\nsudo dnf install git\n\n# Arch Linux\nsudo pacman -S git',
        },
        {
          type: 'text',
          value:
            'After installing, verify it works by checking the version:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git --version',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'check-version',
      prompt: 'Check your Git version by running the version command:',
      expectedCommand: 'git --version',
      acceptableVariants: ['git -v', 'git version'],
      successOutput: 'git version 2.51.0',
      hints: ['The flag for version is --version'],
    },
    {
      type: 'reading',
      id: 'configure-identity',
      title: 'Configuring Your Identity',
      content: [
        {
          type: 'text',
          value:
            'Every Git commit is stamped with your **name** and **email**. This is how Git identifies who made each change. Set these up globally so Git knows who you are:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.name "Your Name"\ngit config --global user.email "your@email.com"',
        },
        {
          type: 'text',
          value:
            "**What name and email should you use?** If you plan to use a platform like GitHub (we'll cover this in a later lesson), your `user.email` should match the email on that account. That's how the platform links commits to your profile — if they don't match, your commits appear as an unknown user.",
        },
        {
          type: 'text',
          value:
            'You should also set the default branch name to `main`. Older Git versions default to `master`, and most new projects now use `main`:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config --global init.defaultBranch main',
        },
      ],
    },
    {
      type: 'reading',
      id: 'config-scope',
      title: 'Global vs. Local Config',
      content: [
        {
          type: 'text',
          value:
            'Git config has two levels you\'ll use. Each level overrides the one above it:',
        },
        {
          type: 'text',
          value:
            '**`--global`** — Applies to all repositories on your machine. This is what you use for your personal name and email.\n\n**`--local`** (or no flag) — Applies only to the current repository. Useful if you need a different email for a work project vs. a personal project.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Set your identity globally (all repos):\ngit config --global user.name "Jane Doe"\ngit config --global user.email "jane@personal.com"\n\n# Override for a specific work project:\ncd ~/work/company-project\ngit config user.name "Jane Doe"\ngit config user.email "jane@company.com"',
        },
        {
          type: 'text',
          value:
            'To check your current config, use:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --list              # Show all settings\ngit config user.name           # Show just your name\ngit config user.email          # Show just your email',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-config',
      prompt: 'Build the command to set your global Git username:',
      availableBlocks: [
        'git',
        'config',
        '--global',
        'user.name',
        '--local',
        '"Your Name"',
        'set',
      ],
      correctAnswer: ['git', 'config', '--global', 'user.name', '"Your Name"'],
      hints: ['Start with "git config"', 'Use the --global flag'],
    },
    {
      type: 'terminal-exercise',
      id: 'check-config',
      prompt: 'Check what email Git is currently using for your commits:',
      expectedCommand: 'git config user.email',
      acceptableVariants: ['git config --global user.email', 'git config --get user.email'],
      successOutput: 'your@email.com',
      hints: [
        'Use git config followed by the setting name',
        'The setting name is user.email',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-config',
      question: 'What does the --global flag do in `git config --global`?',
      options: [
        'Applies the setting to all repos on your machine',
        'Shares the setting with everyone on GitHub',
        'Only applies to the current repository',
        'Makes the setting permanent and unchangeable',
      ],
      correctIndex: 0,
      explanation:
        'The --global flag sets the configuration for your user account, affecting all repositories on your machine. You can override it per-project with --local or by omitting the flag entirely.',
    },
    {
      type: 'quiz',
      id: 'quiz-email-match',
      question: 'Your commits on GitHub show as \'unknown user\'. What is the most likely cause?',
      options: [
        "Your git config email doesn't match any email on your GitHub account",
        'You forgot to run git init',
        'You need to set --system config instead of --global',
        "GitHub doesn't track commit authors",
      ],
      correctIndex: 0,
      explanation:
        "GitHub links commits to your profile by matching the email in the commit metadata to the emails on your GitHub account. If they don't match, the commit will appear as an unknown user. You can fix this by adding the email to your GitHub account or by updating your git config.",
    },
  ],
} satisfies Lesson
