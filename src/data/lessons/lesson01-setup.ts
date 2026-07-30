import type { Lesson } from '@/types'
export default {
  id: 1,
  title: 'Setting Up Git',
  description: 'Install Git and configure your identity',
  steps: [
    {
      type: 'reading',
      id: 'terminal-basics',
      title: 'Meeting your terminal',
      content: [
        {
          type: 'text',
          value:
            'A **terminal** is a window where you tell your computer what to do by typing instead of clicking. Git has no buttons. You drive it entirely from a terminal, so this is the first thing to get comfortable with.',
        },
        {
          type: 'text',
          value:
            'You run a command by typing it and pressing Enter. Nothing happens until you press Enter, so you can always fix a typo before then.',
        },
        {
          type: 'text',
          value:
            'Commands often take extra words starting with a dash, like `--version` or `-m`. Those are called **flags**, and they change what the command does. You will meet a lot of them, and every one is explained where it first appears.',
        },
        {
          type: 'text',
          value: '**Opening a terminal**',
        },
        {
          type: 'list',
          items: [
            'On **macOS**, press Cmd + Space, type `Terminal`, then press Enter. Terminal also lives in Applications, under Utilities.',
            'On **Windows**, you do not have the right terminal yet. Jump to the next step and install Git with the downloadable installer from [git-scm.com](https://git-scm.com/download/win). **Git Bash**, the terminal this course uses, arrives with it. Then come back here, press the Start key, type `Git Bash`, press Enter, and try the commands below.',
            'On **Linux**, press Ctrl + Alt + T, or search your applications for `Terminal`.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Windows: use Git Bash, not PowerShell',
          value:
            'Windows also has PowerShell and Command Prompt, but they speak a different command language. Every Git snippet in this course is written for Git Bash, so pick Git Bash and everything you copy will work as printed. A handful of later steps show a PowerShell alternative as well, labelled as such where it appears, and the Git Bash version next to it always works too, so you can stay in Git Bash the whole way through. The exception is the optional install command on the next step, which runs in PowerShell because Git Bash is not on your machine yet.',
        },
        {
          type: 'text',
          value:
            'Your files live inside folders, and a terminal is always sitting inside one of them. Four commands are enough to move around:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'pwd              # print working directory: which folder am I in?\nls               # list: what is inside this folder?\ncd my-project    # change directory: go into the folder named my-project\ncd ..            # go back up to the folder that contains this one',
        },
        {
          type: 'text',
          value:
            'A normal move looks like this: run `pwd` to see where you are, `ls` to see what is around you, then `cd` into the folder you want. Repeat until you are where you meant to be.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Let Tab do the typing',
          value:
            'Start typing a file or folder name, then press Tab. The terminal finishes the name for you, so you cannot mistype it. If nothing happens, you are probably in the wrong folder, and that is useful to find out early.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'install-git',
      title: 'Installing Git',
      content: [
        {
          type: 'text',
          value: 'There are two ways to install Git:',
        },
        {
          type: 'list',
          items: [
            '**Download the installer** from the official website and click through it like any other app.',
            '**Use a package manager** to install Git with one typed command.',
          ],
        },
        {
          type: 'text',
          value:
            "A **package manager** is a command-line tool that installs, updates, and removes software for you. Think of it as an app store you control by typing commands. You don't need one to install Git, but most developers prefer it: one command to install, one command to update, and your whole team can use the exact same setup.",
        },
        {
          type: 'text',
          value:
            "On **macOS**, Git comes pre-installed on most Macs, but it's often outdated. The recommended way to install the latest version is through [Homebrew](https://brew.sh), the most popular package manager for macOS. If you don't have Homebrew yet, head to the [official website](https://brew.sh) for the installation guide.",
        },
        {
          type: 'code',
          language: 'bash',
          value: 'brew install git',
        },
        {
          type: 'text',
          value:
            'On **Windows**, download the installer from [git-scm.com](https://git-scm.com/download/win) and click through it like any other app. It also installs Git Bash, the terminal recommended on the previous step. Take this path if you have no terminal open yet.',
        },
        {
          type: 'text',
          value:
            'If you already have PowerShell or Windows Terminal open, you can install Git by typing one command there instead, using [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), the package manager built into Windows 10 and 11. Git Bash still comes with it.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'winget install --id Git.Git -e --source winget',
        },
        {
          type: 'text',
          value:
            "On **Linux**, use your distribution's built-in package manager:",
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
            'After installing, open a fresh terminal and check that Git answers you:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git --version',
        },
        {
          type: 'text',
          value:
            'If you get a version number back, Git is installed and on speaking terms with your terminal. Your number will differ from the one in the next step. Any recent version is fine.',
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
      title: 'Configuring your identity',
      content: [
        {
          type: 'text',
          value:
            'Every commit you make is stamped with your **name** and **email**. That stamp is how anyone reading the history, including future you, knows who made each change. Tell Git who you are once, and it uses that for every project on your machine:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.name "Your Name"\ngit config --global user.email "your@email.com"',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Which name and email?',
          value:
            'Use your real name, or the name your teammates know you by. This is a label for humans, not a login. For the email, if you plan to use a platform like GitHub (covered in a later lesson), use the address on your account there. That is how the platform recognises your work as yours.',
        },
        {
          type: 'text',
          value:
            'One more setting, and the rest of the course depends on it. The first line of work in a project is called a **branch**, and it needs a name. Every command in the lessons ahead names that branch `main`, so set this before you create your first project:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config --global init.defaultBranch main',
        },
        {
          type: 'text',
          value:
            'Left alone, Git names that first branch `master` instead. A later lesson asks you to send your work to GitHub with `git push -u origin main`, and in a project whose branch is still called `master` that command fails, because there is no branch by that name to send. Setting `main` now keeps every screen in this course matching your own machine. `main` is also the name GitHub and GitLab give the first branch of a project you create on their website.',
        },
        {
          type: 'text',
          value:
            'There is a second, smaller benefit, and it looks different depending on your computer. On **macOS** and **Linux**, Git prints a block of `hint:` advice about the branch name every time you start a new project, until you make the choice yourself. With the setting in place, `git init` in the next lesson prints one clean line instead of a wall of advice.',
        },
        {
          type: 'text',
          value:
            'On **Windows** there is no advice to silence, because the installer already made the choice for you and wrote `master` into a machine-wide settings file. Git treats that as your decision and stays quiet about it, so without the command above you would land on `master` without ever being asked. That silent choice is the one you are overriding here. Either way the main reason holds on every computer: every command in the rest of this course names the branch `main`.',
        },
        {
          type: 'text',
          value:
            'This setting applies to projects you create from now on, not to ones that already exist. If you installed Git before starting this course, or you already have a project of your own, check that one. Run this inside its folder to see what its branch is called:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git branch',
        },
        {
          type: 'text',
          value:
            'If the answer is `master`, rename it and the rest of the course fits again:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git branch -m master main',
        },
        {
          type: 'text',
          value:
            'The `-m` flag is short for move, which is the word Git uses for renaming a branch.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'config-scope',
      title: 'Global vs. local config',
      content: [
        {
          type: 'text',
          value:
            '`--global` sets a value for every project on this machine. That is what you did on the last step, and it is what you want for now.',
        },
        {
          type: 'text',
          value:
            'Running the same command without `--global`, from inside a project, sets the value for that project alone and overrides the global one there. That becomes useful the day a work project needs a different email from your personal one.',
        },
        {
          type: 'text',
          value: 'To read your settings back at any time:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --list              # show every setting\ngit config user.name           # show only your name\ngit config user.email          # show only your email',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-config',
      prompt: 'Build the command to set your name for every project on your machine:',
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
      hints: [
        'Start with "git config"',
        'Every project on your machine means the --global flag',
        'The order is: git config --global, then the setting name, then the value',
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'check-config',
      prompt: 'Check what email Git is currently stamping on your commits:',
      expectedCommand: 'git config user.email',
      acceptableVariants: ['git config --global user.email', 'git config --get user.email'],
      successOutput: 'your@email.com',
      hints: [
        'Ask git config for a setting by naming it, with no value after it',
        'The setting name is user.email',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-config',
      question:
        'Last week you ran `git config --global user.name "Jane Doe"`. Today you start a brand-new project in a different folder. What name will Git put on commits there?',
      options: [
        {
          text: 'No name. Git refuses to commit until you set your name again inside the new folder.',
          whyWrong:
            'Git only stops you when it has no name anywhere. Your global setting is still in place, so it has one.',
        },
        {
          text: 'Whatever name is on your GitHub account, because GitHub overrides your local settings.',
          whyWrong:
            'GitHub never reaches into your computer to change settings. Git reads only the config files on your machine when it stamps a commit.',
        },
        {
          text: 'Jane Doe, because `--global` applies to every project on your machine.',
        },
        {
          text: 'Jane Doe, but only after you also run `git config --local user.name "Jane Doe"` in the new folder.',
          whyWrong:
            '`--local` is for the case where one project needs a different value. Repeating the same name locally changes nothing.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Git looks for a setting in the current project first, then falls back to your global config. Nothing local overrides it here, so the new project inherits "Jane Doe". You set your identity once, not once per project.',
    },
    {
      type: 'reading',
      id: 'recap',
      title: 'Recap',
      content: [
        { type: 'text', value: 'You can now:' },
        {
          type: 'list',
          items: [
            'Open a terminal on your computer and move between folders in it',
            'Install Git and confirm your terminal can find it',
            'Tell Git your name and email so every commit is stamped with them',
            'Choose between a setting for every project and a setting for one project',
            'Read any setting back when you are not sure what Git thinks',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'pwd                                  # which folder am I in\nls                                   # what is in this folder\ncd my-project                        # go into a folder\ncd ..                                # go back up one folder\ngit --version                        # check Git is installed\ngit config --global user.name "..."  # set your name for every project\ngit config --global user.email "..." # set your email for every project\ngit config --list                    # show every setting',
        },
        {
          type: 'text',
          value:
            'Next up: you turn an ordinary folder into a Git project, so Git can start keeping track of what you change.',
        },
      ],
    },
  ],
} satisfies Lesson
