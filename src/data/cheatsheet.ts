type CheatsheetCommand = {
  command: string
  description: string
  lessonId: number
  danger?: string
}

type CheatsheetCategory = {
  name: string
  commands: CheatsheetCommand[]
}

const cheatsheet: CheatsheetCategory[] = [
  {
    name: 'Moving around the terminal',
    commands: [
      { command: 'pwd', description: 'Which folder am I in', lessonId: 1 },
      { command: 'ls', description: 'What is in this folder', lessonId: 1 },
      { command: 'cd <folder>', description: 'Go into a folder', lessonId: 1 },
      { command: 'cd ..', description: 'Go back up one folder', lessonId: 1 },
      { command: 'cat <file>', description: 'Print what is inside a file', lessonId: 1 },
      { command: 'echo "text" > <file>', description: 'Write a line into a file, replacing what was there', lessonId: 1 },
      { command: 'echo "text" >> <file>', description: 'Add a line to the end of a file', lessonId: 1 },
    ],
  },
  {
    name: 'Setup',
    commands: [
      { command: 'git config --global user.name "Name"', description: 'Set your name for every project', lessonId: 2 },
      { command: 'git config --global user.email "email"', description: 'Set your email for every project', lessonId: 2 },
      { command: 'git config --list', description: 'Show every setting', lessonId: 2 },
      { command: 'git --version', description: 'Check Git is installed', lessonId: 18 },
      { command: 'gh auth login', description: 'Log in to GitHub from the terminal', lessonId: 18 },
      { command: 'git config --global core.editor nano', description: 'Use Nano when Git opens an editor', lessonId: 18 },
    ],
  },
  {
    name: 'Starting a repository',
    commands: [
      { command: 'git init', description: 'Turn the current folder into a repository', lessonId: 3 },
      { command: 'git status', description: 'Show what Git sees right now', lessonId: 3 },
    ],
  },
  {
    name: 'Staging and committing',
    commands: [
      { command: 'git add <file>', description: 'Stage one file', lessonId: 4 },
      { command: 'git add .', description: 'Stage everything in this folder', lessonId: 4 },
      { command: 'git commit -m "msg"', description: 'Commit what is staged, with a message', lessonId: 4 },
      { command: 'git diff', description: 'Changed but not staged yet', lessonId: 5 },
      { command: 'git diff --staged', description: 'Staged and ready for the next commit', lessonId: 5 },
      { command: 'git log', description: 'Full history', lessonId: 5 },
      { command: 'git log --oneline', description: 'One line per commit', lessonId: 5 },
      { command: 'git show <hash>', description: 'What one commit changed', lessonId: 5 },
    ],
  },
  {
    name: 'Ignoring files',
    commands: [
      { command: 'git status --ignored', description: 'List the files Git is skipping', lessonId: 6 },
      { command: 'git rm --cached <file>', description: 'Stop tracking a file, keep it on disk', lessonId: 7 },
      { command: 'git rm -r --cached <folder>', description: 'Same, for a whole folder', lessonId: 7 },
    ],
  },
  {
    name: 'Branching',
    commands: [
      { command: 'git branch', description: 'List your branches; * marks where you are', lessonId: 8 },
      { command: 'git switch -c <name>', description: 'Create a branch and move onto it', lessonId: 8 },
      { command: 'git switch <name>', description: 'Move to a branch that already exists', lessonId: 8 },
      { command: 'git branch -d <name>', description: 'Delete a branch you have finished with', lessonId: 9 },
    ],
  },
  {
    name: 'Merging',
    commands: [
      { command: 'git merge <branch>', description: 'Fold that branch into the one you are on', lessonId: 9 },
      { command: 'git log --oneline --graph', description: 'See the history, merge and all', lessonId: 9 },
      { command: 'git merge --abort', description: 'Cancel a merge and go back', lessonId: 10 },
    ],
  },
  {
    name: 'Stashing',
    commands: [
      { command: 'git stash', description: 'Shelve your changes (tracked files only)', lessonId: 11 },
      { command: 'git stash -u', description: 'Shelve brand-new untracked files too', lessonId: 11 },
      { command: 'git stash list', description: 'Show everything on the shelf', lessonId: 11 },
      { command: 'git stash pop', description: 'Bring the newest one back and remove it', lessonId: 11 },
    ],
  },
  {
    name: 'Undoing things',
    commands: [
      { command: 'git restore --staged <file>', description: 'Take a file off the staging area', lessonId: 12 },
      {
        command: 'git restore <file>',
        description: 'Throw away unstaged edits',
        lessonId: 12,
        danger: 'Those edits are gone for good. There is no undo.',
      },
      {
        command: 'git restore .',
        description: 'Throw away every unstaged edit in this folder',
        lessonId: 12,
        danger: 'Every uncommitted edit is gone for good. There is no undo.',
      },
      { command: 'git commit --amend -m "msg"', description: 'Replace the commit you just made', lessonId: 12 },
      { command: 'git commit --amend --no-edit', description: 'Same, keeping the old message', lessonId: 12 },
      { command: 'git revert HEAD', description: 'Add a commit that undoes the last one', lessonId: 17 },
      { command: 'git reflog', description: 'Every place HEAD has been on this machine', lessonId: 20 },
      { command: 'git switch -c recovered <hash>', description: 'Rescue a commit from the reflog by branching at it', lessonId: 20 },
      { command: 'git reset --soft HEAD~1', description: 'Undo last commit, keep changes staged', lessonId: 20 },
      { command: 'git reset HEAD~1', description: 'Undo last commit, keep changes in your files', lessonId: 20 },
      {
        command: 'git reset --hard HEAD~1',
        description: 'Undo last commit and wipe the changes',
        lessonId: 20,
        danger: 'Uncommitted work is wiped with no undo. Only the reflog can bring the commit back.',
      },
    ],
  },
  {
    name: 'Remotes and GitHub',
    commands: [
      { command: 'git clone <url>', description: 'Copy an existing project down from GitHub', lessonId: 13 },
      { command: 'git remote -v', description: 'List the remotes this project knows about', lessonId: 13 },
      { command: 'git push', description: 'Send new commits up, once the pairing exists', lessonId: 14 },
      { command: 'git pull', description: 'Bring new commits down and combine them', lessonId: 14 },
      { command: 'git remote add origin <url>', description: 'Give a URL the nickname "origin"', lessonId: 15 },
      { command: 'git push -u origin main', description: 'First push, and pair the branch with the remote', lessonId: 15 },
      { command: 'git fetch origin', description: 'Look at what is new without touching your files', lessonId: 21 },
    ],
  },
  {
    name: 'Working on a team',
    commands: [
      { command: 'git push -u origin <branch>', description: 'Publish it and set up tracking', lessonId: 16 },
      { command: 'git pull origin main', description: 'Bring the latest main into your branch', lessonId: 16 },
    ],
  },
]

export default cheatsheet
export type { CheatsheetCommand, CheatsheetCategory }
