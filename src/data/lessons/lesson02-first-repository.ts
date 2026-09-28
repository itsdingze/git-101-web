import type { Lesson } from '@/types'
export default {
  id: 2,
  title: 'Your First Repository',
  description: 'Initialise a repo and understand file states',
  unlocks: ['init', 'status'],
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
            'Your **working directory** is the project folder you open in your editor. This is where you write and change files the normal way.',
            'The **staging area** is a holding zone where you gather the changes you want to record next. Nothing here is saved into history yet.',
            'The **repository** keeps the permanent record of every change you have committed. Git stores that record in a hidden `.git` folder inside your project.',
          ],
        },
        {
          type: 'text',
          value:
            'One thing to know now: the word **repository** gets used two ways. Loosely it means the whole project you are working in, files and history together. Precisely, when it names one of the three places above, it means the store of committed history, and Git keeps that store in the hidden `.git` folder. So the same folder can be called your working directory in one sentence and your repository in the next without either being wrong. When you read "repository", it is worth asking which one is meant.',
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
      id: 'git-init',
      title: 'Initialising a repository',
      content: [
        {
          type: 'text',
          value:
            'Git needs a project before it has anything to do. The project for this lesson and the next is a short story. It lives in a folder called `my-story`, which holds two files, `chapter-one.md` and `outline.md`. So far it is an ordinary folder like any folder of holiday photos. Git knows nothing about it.',
        },
        {
          type: 'text',
          value: 'One command changes that. Run it from inside the folder:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git init    # turn the current folder into a Git repository',
        },
        {
          type: 'text',
          value: 'Git replies with the full path of what it just created:',
        },
        {
          type: 'code',
          language: 'text',
          value: 'Initialized empty Git repository in /home/user/my-story/.git/',
        },
        {
          type: 'text',
          value:
            '`git init` creates one new thing: a hidden folder called `.git` inside your project. That folder is the repository in the precise sense, the store of committed history. Every commit you ever make here goes into it. Everything else in the folder is still your ordinary project files, untouched.',
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
      type: 'reading',
      id: 'file-states',
      title: 'What Git thinks of each file',
      content: [
        {
          type: 'text',
          value: 'Before doing anything else, ask Git what it currently sees:',
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
            '"Committed" is not a fifth state. It is the event that ends the cycle. When you commit, the staged version is written into history and the file drops back to **unmodified**, because it now matches the newest commit. Edit it again and it becomes modified again.',
        },
        {
          type: 'text',
          value:
            'Saving is not committing. Pressing `Ctrl+S` moves a file from unmodified to modified and nothing more. It stays modified until you commit it.',
        },
        {
          type: 'text',
          value:
            'Right after `git init`, both files in the folder show up as **untracked**. Git can see `chapter-one.md` and `outline.md` sitting there but has not been asked to look after either of them. The same happens whenever you run `git init` in a folder that already holds work, however many files it holds. Treat `git status` as asking Git "what is going on right now?" You will run it constantly, and it is never a wasted command.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'first-repository-walkthrough',
      title: 'Practice: turn a folder into a repository',
      mode: 'guided',
      brief:
        'Below is the folder `my-story`, holding `chapter-one.md` and `outline.md`. Nothing in it belongs to Git yet. Work through the goals one at a time, and read what Git prints back after every command. Type `help` for the list of commands available.',
      seed: {
        dir: 'my-story',
        setup: [
          {
            write: {
              'chapter-one.md': 'The lighthouse had been dark for a year.\n',
              'outline.md': 'Chapter one: the keeper finds the lighthouse dark.\n',
            },
          },
        ],
      },
      goals: [
        {
          id: 'repo',
          label: 'The folder is a Git repository',
          narration:
            'Start by handing the folder to Git. The reply is the path of the hidden `.git` folder it just created, which is where every commit you make here will be stored.',
          check: { kind: 'repo-initialized' },
          hints: [
            'Git only looks after a folder once you tell it to. Nothing works before that.',
            'The command is `git init`.',
            'Type `git init` and press Enter.',
          ],
        },
        {
          id: 'notes-file',
          label: 'A third file called `notes.txt` sits in the folder',
          narration:
            'Now run `git status`. Both files are listed as **untracked**: Git can see them but has never been asked to look after them. Next, create a third file and run `git status` again to watch Git notice it straight away. There is no editor here, so write the file from the command line with `>`.',
          check: { kind: 'file-present', path: 'notes.txt' },
          hints: [
            'Run `git status` first so you can see what changes afterwards. Then make a new file.',
            '`echo` prints text, and `>` sends that text into a file instead, creating the file if it does not exist.',
            'Run `echo "Cut the second paragraph" > notes.txt`, then run `git status` again.',
          ],
        },
      ],
      completionMessage:
        'Three untracked files, and Git has recorded none of them. That is the honest starting point of every new repository. `git status` is the command you come back to constantly, because it always answers the same question: what is going on right now?',
    },
    {
      type: 'quiz',
      id: 'quiz-file-states',
      question:
        'You committed `chapter-one.md` yesterday and have not opened it since. What state is it in today?',
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
        'You edit `outline.md` in your editor and press `Ctrl+S`. You run no Git commands. What has Git recorded?',
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
      id: 'buttons-and-commands',
      title: 'The buttons run these commands',
      content: [
        {
          type: 'text',
          value:
            'If you drive Git from a panel in your editor or an app like GitHub Desktop, every button there runs one of the commands you are learning. `git add` is the `+` button next to a file. `git commit` is the tick. The four file states are the groups the panel sorts your files into. Once a command makes sense, clicking the button that runs it is no mystery.',
        },
        {
          type: 'text',
          value:
            'The **Cheat Sheet** button at the top of the page lists every command you have covered so far.',
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
            'Turn any folder into a Git repository with `git init`',
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
