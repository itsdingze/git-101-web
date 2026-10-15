export type CheatsheetCommand = {
  command: string
  description: string
  lessonId: number
  danger?: string
}

type CheatsheetCategory = {
  name: string
  commands: CheatsheetCommand[]
}

export const cheatsheet: CheatsheetCategory[] = [
  {
    name: 'Moving around the terminal',
    commands: [
      { command: 'pwd', description: "Print working directory: show which folder you're in", lessonId: 1 },
      { command: 'ls', description: "List what's in this folder", lessonId: 1 },
      { command: 'ls -a', description: 'Also list hidden files, like .git', lessonId: 2 },
      { command: 'cd <folder>', description: 'Change directory: go into a folder', lessonId: 1 },
      { command: 'cd ..', description: 'Go back up one folder', lessonId: 1 },
    ],
  },
  {
    name: 'Starting a project',
    commands: [
      { command: 'git init', description: 'Turn this folder into a repository', lessonId: 2 },
      { command: 'git config --global user.name "..."', description: 'Set your default commit name on this computer', lessonId: 2 },
      { command: 'git config --global user.email "..."', description: 'Set your default commit email on this computer', lessonId: 2 },
      { command: 'git config --list', description: 'Show every setting', lessonId: 2 },
    ],
  },
  {
    name: 'Making commits',
    commands: [
      { command: 'git status', description: 'Show staged, unstaged, and untracked files', lessonId: 3 },
      { command: 'git add .', description: 'Stage changes in this folder and its subfolders, except ignored untracked files', lessonId: 3 },
      { command: 'git add <file> <file>', description: 'Stage only these files', lessonId: 4 },
      { command: 'git commit -m "..."', description: 'Commit what you staged, with a message', lessonId: 3 },
      { command: 'git rm --cached <file>', description: 'Stage removal from tracking and keep the file on your computer', lessonId: 4 },
    ],
  },
  {
    name: 'Branching and merging',
    commands: [
      { command: 'git switch -c <branch>', description: 'Create a branch and move onto it', lessonId: 5 },
      { command: 'git switch <branch>', description: 'Move to an existing branch', lessonId: 5 },
      { command: 'git merge <branch>', description: "Bring that branch's work into the one you're on", lessonId: 5 },
      { command: 'git branch -d <branch>', description: 'Delete a branch you already merged', lessonId: 5 },
    ],
  },
  {
    name: 'Undoing changes',
    commands: [
      {
        command: 'git restore <file>',
        description: 'Replace the file with its staged version',
        lessonId: 6,
        danger: 'Unstaged edits are overwritten. Commit or stash anything you need to keep first.',
      },
      {
        command: 'git restore .',
        description: 'Discard unstaged edits to tracked files in this folder and its subfolders',
        lessonId: 6,
        danger: 'These unstaged edits are overwritten. Commit or stash anything you need to keep first.',
      },
      { command: 'git restore --staged <file>', description: 'Unstage a file, and keep your edit', lessonId: 6 },
      {
        command: 'git commit --amend -m "..."',
        description: "Replace your last commit, if you haven't shared it yet",
        lessonId: 6,
      },
    ],
  },
  {
    name: 'Reading history',
    commands: [
      { command: 'git log', description: "List commits in this branch's history, newest first", lessonId: 5 },
      { command: 'git log --oneline', description: 'One line per commit', lessonId: 5 },
      { command: 'git log --oneline --graph', description: "Draw connections between commits in this branch's history", lessonId: 5 },
      { command: 'git show <hash>', description: 'Show what one commit changed', lessonId: 7 },
      { command: 'git diff', description: 'Show unstaged changes to tracked files', lessonId: 7 },
      { command: 'git diff --staged', description: 'Show staged changes compared with the last commit', lessonId: 7 },
    ],
  },
  {
    name: 'Working with GitHub',
    commands: [
      { command: 'gh auth status', description: "Check you're signed in to GitHub", lessonId: 8 },
      { command: 'gh auth login --with-token < <file>', description: 'Sign in with a token saved in a file', lessonId: 8 },
      { command: 'git remote add origin <url>', description: 'Save the remote address under the name origin', lessonId: 8 },
      { command: 'git remote -v', description: 'List remotes and their addresses', lessonId: 8 },
      { command: 'git push -u origin <branch>', description: 'Push the branch to origin and pair it with the remote branch', lessonId: 8 },
      { command: 'git push', description: 'Push new commits to the paired remote branch', lessonId: 8 },
      { command: 'gh repo clone <owner>/<repository>', description: 'Copy a repository onto this computer', lessonId: 8 },
      { command: 'git clone <url>', description: 'Copy a repository by its address', lessonId: 8 },
      { command: 'git pull', description: 'In this course, fetch commits from the paired branch and merge them here', lessonId: 9 },
    ],
  },
  {
    name: 'Using pull requests',
    commands: [
      { command: 'gh pr create --title "..." --body "..."', description: 'Open a pull request for this branch', lessonId: 9 },
      { command: 'gh pr view', description: 'Show the pull request for this branch', lessonId: 9 },
      {
        command: 'gh pr merge <number> --merge --delete-branch',
        description: 'Merge a pull request, then delete its branch',
        lessonId: 9,
      },
    ],
  },
  {
    name: "Bringing in teammates' changes",
    commands: [
      { command: 'git pull origin main', description: "Bring GitHub's main into your current branch without switching branches", lessonId: 10 },
      { command: 'git commit --no-edit', description: "Finish a merge, keeping Git's message", lessonId: 10 },
      { command: 'git stash', description: 'Store changes to tracked files for later, leaving untracked files in place', lessonId: 10 },
      { command: 'git stash pop', description: 'Reapply the latest stash and remove it if this succeeds', lessonId: 10 },
      { command: 'git stash list', description: 'List stored stashes', lessonId: 10 },
    ],
  },
  {
    name: 'Setting up your computer',
    commands: [
      { command: 'git --version', description: 'Check Git is installed', lessonId: 11 },
      { command: 'git config --global init.defaultBranch main', description: 'Start new repositories on main', lessonId: 11 },
      { command: 'git config --global pull.rebase false', description: 'Use merging rather than rebasing when pulling', lessonId: 11 },
      { command: 'git config --global core.editor nano', description: 'Use Nano when Git opens an editor', lessonId: 11 },
      { command: 'gh auth login', description: 'Sign in to GitHub from the terminal', lessonId: 11 },
    ],
  },
  {
    name: 'Using Git on your computer',
    commands: [
      { command: 'gh repo create <name> --private', description: 'Create a private repository on GitHub', lessonId: 12 },
      { command: 'gh pr view --web', description: 'Open the pull request for review and merging on GitHub', lessonId: 12 },
    ],
  },
]
