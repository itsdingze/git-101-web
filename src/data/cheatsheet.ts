type CheatsheetCommand = {
  command: string
  description: string
  lessonId: number
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
    ],
  },
  {
    name: 'Setup',
    commands: [
      { command: 'git --version', description: 'Check Git is installed', lessonId: 1 },
      { command: 'git config --global user.name "Name"', description: 'Set your name for every project', lessonId: 1 },
      { command: 'git config --global user.email "email"', description: 'Set your email for every project', lessonId: 1 },
      { command: 'git config --list', description: 'Show every setting', lessonId: 1 },
    ],
  },
  {
    name: 'Starting a repository',
    commands: [
      { command: 'git init', description: 'Turn the current folder into a repository', lessonId: 2 },
      { command: 'git clone <url>', description: 'Copy an existing project down from GitHub', lessonId: 4 },
    ],
  },
  {
    name: 'Staging and committing',
    commands: [
      { command: 'git status', description: 'Show what Git sees right now', lessonId: 2 },
      { command: 'git add <file>', description: 'Stage one file', lessonId: 3 },
      { command: 'git add .', description: 'Stage everything in this folder', lessonId: 3 },
      { command: 'git add -A', description: 'Stage everything in the whole project', lessonId: 3 },
      { command: 'git commit -m "msg"', description: 'Save a snapshot with a message', lessonId: 3 },
      { command: 'git diff', description: 'Changed but not staged yet', lessonId: 3 },
      { command: 'git diff --staged', description: 'Staged and ready for the next commit', lessonId: 3 },
      { command: 'git log', description: 'Full history', lessonId: 3 },
      { command: 'git log --oneline', description: 'One line per commit', lessonId: 3 },
    ],
  },
  {
    name: 'Remotes and GitHub',
    commands: [
      { command: 'gh auth login', description: 'Log in to GitHub from the terminal', lessonId: 4 },
      { command: 'git remote -v', description: 'List the remotes this project knows about', lessonId: 4 },
      { command: 'git remote add origin <url>', description: 'Give a URL the nickname "origin"', lessonId: 4 },
      { command: 'git push -u origin main', description: 'First push, and pair the branch with the remote', lessonId: 4 },
      { command: 'git push', description: 'Send new commits up, once the pairing exists', lessonId: 4 },
      { command: 'git pull', description: 'Bring new commits down and combine them', lessonId: 4 },
      { command: 'git fetch origin', description: 'Look at what is new without touching your files', lessonId: 4 },
    ],
  },
  {
    name: 'Ignoring files',
    commands: [
      { command: 'git status --ignored', description: 'List the files Git is skipping', lessonId: 5 },
      { command: 'git rm --cached <file>', description: 'Stop tracking a file, keep it on disk', lessonId: 5 },
      { command: 'git rm -r --cached <folder>', description: 'Same, for a whole folder', lessonId: 5 },
      { command: 'git add -f <file>', description: 'Stage one ignored file anyway', lessonId: 5 },
    ],
  },
  {
    name: 'Branching',
    commands: [
      { command: 'git branch', description: 'List your branches; * marks where you are', lessonId: 6 },
      { command: 'git switch -c <name>', description: 'Create a branch and move onto it', lessonId: 6 },
      { command: 'git switch <name>', description: 'Move to a branch that already exists', lessonId: 6 },
      { command: 'git branch -d <name>', description: 'Delete a branch you have finished with', lessonId: 6 },
    ],
  },
  {
    name: 'Merging',
    commands: [
      { command: 'git merge <branch>', description: 'Fold that branch into the one you are on', lessonId: 7 },
      { command: 'git log --oneline --graph', description: 'See the history, merge and all', lessonId: 7 },
      { command: 'git merge --abort', description: 'Cancel a merge and go back', lessonId: 8 },
    ],
  },
  {
    name: 'Stashing',
    commands: [
      { command: 'git stash', description: 'Shelve your changes (tracked files only)', lessonId: 9 },
      { command: 'git stash -u', description: 'Shelve brand-new untracked files too', lessonId: 9 },
      { command: 'git stash push -m "note"', description: 'Shelve with a note about what is inside', lessonId: 9 },
      { command: 'git stash list', description: 'Show everything on the shelf', lessonId: 9 },
      { command: 'git stash pop', description: 'Bring the newest one back and remove it', lessonId: 9 },
      { command: 'git stash apply', description: 'Bring it back but keep it on the shelf', lessonId: 9 },
      { command: 'git stash drop', description: 'Throw the newest one away', lessonId: 9 },
    ],
  },
  {
    name: 'Undoing things',
    commands: [
      { command: 'git restore --staged <file>', description: 'Take a file off the staging shortlist', lessonId: 10 },
      { command: 'git restore <file>', description: 'Throw away uncommitted edits (no undo)', lessonId: 10 },
      { command: 'git commit --amend -m "msg"', description: 'Replace the commit you just made', lessonId: 10 },
      { command: 'git commit --amend --no-edit', description: 'Same, keeping the old message', lessonId: 10 },
      { command: 'git revert HEAD', description: 'Add a commit that undoes the last one', lessonId: 10 },
      { command: 'git reflog', description: 'Every place HEAD has been on this machine', lessonId: 10 },
      { command: 'git switch -c recovered <hash>', description: 'Rescue a commit from the reflog by branching at it', lessonId: 10 },
      { command: 'git reset --soft HEAD~1', description: 'Undo last commit, keep changes staged', lessonId: 10 },
      { command: 'git reset HEAD~1', description: 'Undo last commit, keep changes in your files', lessonId: 10 },
      { command: 'git reset --hard HEAD~1', description: 'Undo last commit and wipe the changes', lessonId: 10 },
      { command: 'git push --force-with-lease', description: 'Push a rewritten branch of your own, safely', lessonId: 10 },
    ],
  },
  {
    name: 'Working on a team',
    commands: [
      { command: 'git switch -c feature/x', description: 'Start a feature branch', lessonId: 11 },
      { command: 'git push -u origin feature/x', description: 'Publish it and set up tracking', lessonId: 11 },
      { command: 'git rebase main', description: 'Replay your commits on top of main', lessonId: 11 },
      { command: 'git remote add upstream <url>', description: 'Track the project you forked from', lessonId: 11 },
      { command: 'git tag -a v1.0 -m "msg"', description: 'Bookmark a release', lessonId: 11 },
      { command: 'git blame <file>', description: 'Who last changed each line', lessonId: 11 },
    ],
  },
]

export default cheatsheet
export type { CheatsheetCommand, CheatsheetCategory }
