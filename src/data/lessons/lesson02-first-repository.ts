import type { Lesson } from '@/types'
export default {
  id: 2,
  title: 'Your First Repository',
  description: 'Initialise a repo and understand file states',

  steps: [
    {
      type: 'reading',
      id: 'three-areas',
      title: 'The three areas of Git',
      content: [
        {
          type: 'text',
          value:
            'Git keeps your work in **three separate places**. Learning to tell them apart pays off immediately: nearly every confusing message Git prints is really telling you which of these three places something is in.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Your **working directory** is the project folder on your computer, the one you open in your editor. This is where you write and change files the normal way.',
            'The **staging area** is a holding zone where you gather the changes you want to record next. Nothing here is saved into history yet.',
            'The **repository** keeps the permanent record of every change you have committed. Git stores that record in a hidden `.git` folder inside your project.',
          ],
        },
        {
          type: 'text',
          value:
            'One thing to know now: the word **repository** gets used two ways. Loosely it means the whole project you are working in, files and history together, which is how lesson 0 used it. Precisely, when it names one of the three places above, it means the store of committed history, and Git keeps that store in the hidden `.git` folder. So the same folder can be called your working directory in one sentence and your repository in the next without either being wrong. You will meet both usages, so when you read "repository" it is worth asking which one is meant.',
        },
        {
          type: 'text',
          value:
            "Think of it like packing a box to ship. Your desk is the working directory (messy, in-progress). You move finished items to a packing table (staging area). When everything's ready, you seal and label the box (a commit, stored in the repository).",
        },
      ],
      visualization: 'three-place-model',
    },
    {
      type: 'reading',
      id: 'create-the-project',
      title: 'Build the project you will use',
      content: [
        {
          type: 'text',
          value:
            'Git looks after a project, so you need a project before Git has anything to do. In this step you will make a folder called `my-project` holding two files, `index.html` and `style.css`. Every lesson after this one uses that same little project, so it is worth building it now.',
        },
        {
          type: 'text',
          value: 'Open your terminal and run these two commands, one at a time:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'mkdir my-project    # make a new folder called my-project\ncd my-project       # move into that folder',
        },
        {
          type: 'text',
          value:
            '`mkdir` is short for "make directory", and **directory** is the older word for folder. `cd` is short for "change directory" and moves you inside it. Your prompt should now mention `my-project`, which is the terminal telling you where you are. Everything from here happens inside that folder.',
        },
        {
          type: 'text',
          value:
            'Now the two files. There are two ways to create them and both end with exactly the same result, so pick whichever feels less strange to you.',
        },
        {
          type: 'text',
          value:
            '**Route A: use a text editor.** Open the folder in your editor. In VS Code you can type `code .` in the terminal, where the `.` means "the folder I am in", or use **File > Open Folder** and choose `my-project`. Create a new file, name it `index.html`, and put this one line in it:',
        },
        {
          type: 'code',
          language: 'html',
          value: '<h1>Hello</h1>',
        },
        {
          type: 'text',
          value: 'Create a second file, name it `style.css`, and put this one line in it:',
        },
        {
          type: 'code',
          language: 'css',
          value: 'body { font-family: sans-serif; }',
        },
        {
          type: 'text',
          value:
            'Save both files with `Ctrl+S` (`Cmd+S` on a Mac). Make sure both sit directly inside `my-project` and not in a folder of their own.',
        },
        {
          type: 'text',
          value:
            '**Route B: type them in the terminal.** These two commands write the same two files without leaving the terminal. Run them in **Git Bash**, the terminal lesson 1 set you up with:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'echo "<h1>Hello</h1>" > index.html\necho "body { font-family: sans-serif; }" > style.css',
        },
        {
          type: 'text',
          value:
            '`echo` normally prints text back to you. The `>` sends that text into the file named after it instead, creating the file if it does not exist. Careful with `>`, because it replaces whatever the file held before.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Windows: do not use these two lines in PowerShell',
          value:
            'PowerShell writes files in a different text encoding, and Git reads the result as a binary file rather than as text. Your commits would then report no lines added and `git diff` would refuse to show your changes. Use Git Bash for these two commands, or take Route A and save the files from your editor. If you are already in PowerShell, `Set-Content -Encoding utf8 index.html \'<h1>Hello</h1>\'` writes it correctly.',
        },
        {
          type: 'text',
          value: 'Whichever route you took, check that both files are really there:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'ls    # list the files in this folder',
        },
        {
          type: 'text',
          value:
            'You should see both names listed, `index.html` and `style.css`. If one is missing, you are probably in the wrong folder or the file was saved elsewhere, so create the missing one again before moving on.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'No Git yet',
          value:
            'This is an ordinary folder with two ordinary files in it, exactly like any folder of holiday photos, and Git knows nothing about it so far. Turning it into something Git looks after is the next thing you do.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'git-init',
      title: 'Initialising a repository',
      content: [
        {
          type: 'text',
          value:
            'You are already inside `my-project` from the last step, so you can run `git init` straight away. If you closed the terminal since then, move back into the folder first with `cd my-project`:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'cd my-project    # only needed if you are not already inside it\ngit init         # turn this folder into a Git repository',
        },
        {
          type: 'text',
          value:
            'Git replies with the full path of what it created. Your folder is now a **repository**, a project whose history Git is keeping.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Your path will look different',
          value:
            'The folder path Git prints depends on your computer. On macOS or Linux it looks like `/home/you/my-project/.git/`, and on Windows like `C:/Users/you/my-project/.git/`. Different path, same result.',
        },
        {
          type: 'text',
          value:
            '`git init` creates one new thing: a hidden folder called `.git` inside your project. That folder is the repository in the precise sense, the store of committed history, and every commit you will ever make here goes into it. Everything else in the folder is still your ordinary project files, untouched.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Leave the .git folder alone',
          value:
            'Never edit files inside `.git` by hand, and never delete the folder. Deleting `.git` deletes your entire project history while leaving your files behind, and there is no undo for it.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-init',
      prompt: 'Initialise a new Git repository:',
      expectedCommand: 'git init',
      acceptableVariants: [],
      successOutput:
        'Initialized empty Git repository in /home/user/my-project/.git/',
      hints: ['The command is two words: git + init'],
    },
    {
      type: 'reading',
      id: 'file-states',
      title: 'What Git thinks of each file',
      content: [
        {
          type: 'text',
          value:
            'Before doing anything else, ask Git what it currently sees:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git status',
        },
        {
          type: 'text',
          value:
            '`git status` will be your most-used command. It answers two questions about every file, and those two answers together decide which of four states a file is in. First: does Git know about this file at all? Second: if it does, where does the newest version of that file live?',
        },
        {
          type: 'list',
          items: [
            '**Untracked** means Git has never been told to look after this file at all. Every brand-new file starts here, and Git will not record it until you tell it to.',
            '**Unmodified** means Git knows the file and the newest version of it is in the last commit. This is the quiet, everyday state, and most files in a project sit here most of the time.',
            '**Modified** means Git knows the file, but the newest version of it exists only in your project folder. A tracked file lands here the moment you change and save it, and it stays here until you say you want the change recorded.',
            '**Staged** means the newest version is on the packing table. You have marked it to go into the next commit, and it is waiting for the box to be sealed.',
          ],
        },
        {
          type: 'text',
          value:
            '"Committed" is not a fifth state — it is the event that ends the cycle. When you commit, the staged version is written into history and the file drops back to **unmodified**, because it now matches the newest commit. Edit it again and it becomes modified again.',
        },
        {
          type: 'text',
          value:
            'This is where the earlier point about **a commit not being `Ctrl+S`** becomes concrete: saving moves a file from unmodified to modified and nothing more, and it stays modified until you commit it.',
        },
        {
          type: 'text',
          value:
            'Right after `git init`, the two files you made, `index.html` and `style.css`, both show up as **untracked**. Git can see them sitting in the folder but has not been asked to look after either of them yet. The same happens whenever you run `git init` in a folder that already holds work, however many files it holds. Treat `git status` as asking Git "what is going on right now?" You will run it constantly, and it is never a wasted command.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'run-status',
      prompt: 'Check the status of your new repository:',
      expectedCommand: 'git status',
      acceptableVariants: [],
      successOutput:
        'On branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tindex.html\n\tstyle.css\n\nnothing added to commit but untracked files present (use "git add" to track)',
      hints: ['The command is two words: git + status'],
    },
    {
      type: 'quiz',
      id: 'quiz-file-states',
      question:
        'You committed `index.html` yesterday and have not opened it since. What state is it in today?',
      options: [
        {
          text: 'Untracked',
          whyWrong:
            'Untracked means Git has never been told to look after the file. Once a file has been committed, Git tracks it from then on.',
        },
        {
          text: 'Modified',
          whyWrong:
            'Modified means the file on disk is different from the last commit. You have not changed it, so there is nothing different about it.',
        },
        {
          text: 'Unmodified',
        },
        {
          text: 'Staged',
          whyWrong:
            'Staged means you have marked a change to go into the next commit. Here the last change is already committed, so there is nothing new to mark.',
        },
      ],
      correctIndex: 2,
      explanation:
        'A tracked file that matches the last commit is unmodified. This is the state most files sit in most of the time, which is why `git status` stays quiet about them and only lists what is different.',
    },
    {
      type: 'quiz',
      id: 'quiz-save-vs-commit',
      question:
        'You edit `style.css` in your editor and press `Ctrl+S`. You run no Git commands. What has Git recorded?',
      options: [
        {
          text: 'Git copied the change into `.git` automatically',
          whyWrong:
            'Git never records anything on its own. The `.git` folder only changes when you run a command that puts something there.',
        },
        {
          text: 'Nothing. Git records the change only when you commit it',
        },
        {
          text: 'The change is now in the staging area',
          whyWrong:
            'Saving and staging are separate actions. A change reaches the staging area only when you run `git add`, which is the next lesson.',
        },
        {
          text: 'The change was added to your most recent commit',
          whyWrong:
            'A commit is a snapshot taken at the moment you run `git commit`. Existing commits do not change when you edit files afterwards.',
        },
      ],
      correctIndex: 1,
      explanation:
        'Saving puts the new version on your disk. Committing puts it into Git\'s history. Until you commit, `git status` shows the file as modified, which is Git telling you it can see a change it has not been asked to keep.',
    },
    {
      type: 'reading',
      id: 'vscode-gui',
      title: 'VS Code Source Control',
      content: [
        {
          type: 'text',
          value:
            'If you use **VS Code**, it has a built-in **Source Control** panel (the branch icon in the sidebar, or `Ctrl+Shift+G` / `Cmd+Shift+G`). It lists your untracked, modified, and staged files, and you can stage, unstage, and commit by clicking.',
        },
        {
          type: 'text',
          value:
            'Clicking is convenient, but **learn the commands first**. Commands work everywhere: on servers, in other editors, inside automated tools. Knowing them is also what tells you what the buttons are actually doing when something goes wrong. Once the commands feel comfortable, use whichever interface you prefer.',
        },
        {
          type: 'text',
          value:
            "As you learn new commands, use the **Cheat Sheet** button in the bar at the top of this page to look them up. It keeps track of what you have covered so far.",
        },
      ],
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
            'Turn any folder on your computer into a Git repository with `git init`',
            'Name the three places Git keeps your work: the working directory, the staging area, and the repository',
            'Run `git status` and say which state each file is in: untracked, unmodified, modified, or staged',
            'Explain why saving a file is not the same as committing it',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git init      # turn the current folder into a Git repository\ngit status    # show what Git sees right now',
        },
        {
          type: 'text',
          value:
            'Next up: you finally put something in the box. You will choose which changes to stage, then record your first commit.',
        },
      ],
    },
  ],
} satisfies Lesson
