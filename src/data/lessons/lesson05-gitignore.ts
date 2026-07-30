import type { Lesson } from '@/types'
export default {
  id: 5,
  title: '.gitignore',
  description: 'Tell Git which files to ignore',
  steps: [
    {
      type: 'reading',
      id: 'why-gitignore',
      title: 'Why ignore files?',
      content: [
        {
          type: 'text',
          value:
            'Not every file in your project folder belongs in Git. Some are created automatically by other tools, some hold passwords, and some are junk your operating system leaves behind. Committing them makes your history noisy and can cause real problems for the people you work with.',
        },
        {
          type: 'text',
          value: 'The usual suspects you should keep out of Git:',
        },
        {
          type: 'list',
          items: [
            '**Dependencies** like `node_modules/` are downloaded libraries, often tens of thousands of files. Anyone can re-download them in one command, so there is no reason to store them.',
            '**Secret settings** live in files like `.env`, which hold passwords and API keys. An **API key** is a password your program uses to talk to another service. Commit one to a public repo and strangers can use it.',
            '**Operating system junk** means `.DS_Store` on macOS and `Thumbs.db` on Windows. Your OS writes these to remember folder layouts. They mean nothing to your project.',
            '**Build output** is generated from your source code every time you build, and it lands in folders like `dist/` or `build/`. Keep the source, drop the output.',
          ],
        },
        {
          type: 'text',
          value:
            'Git will not guess any of this for you. You tell it what to skip, in a file called `.gitignore`.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'creating-gitignore',
      title: 'Creating a .gitignore file',
      content: [
        {
          type: 'text',
          value:
            'A `.gitignore` file is a plain text file listing what Git should skip, one **pattern** per line. A pattern is a file name, a folder name, or a name with a wildcard in it. Create the file in the top folder of your repository, the same folder you ran `git init` in. Name it exactly `.gitignore`, dot included.',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n\n# Secret settings\n.env\n.env.local\n\n# OS junk\n.DS_Store\nThumbs.db\n\n# Editor settings\n.idea/',
        },
        {
          type: 'text',
          value:
            'Lines starting with `#` are notes for humans. Git ignores them. Blank lines are fine too, and they are useful for grouping related rules. From now on, matching files stay out of `git status` and out of `git add .`, so you cannot commit them by accident.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Commit the .gitignore file itself',
          value:
            'The `.gitignore` file is the one file on this topic that you *do* want in Git. Committing it means everyone who clones your project gets the same ignore rules, so nobody re-adds `node_modules/` by mistake. Add and commit it early. In a new repository it is usually the second thing in, right after the README.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keeping an empty folder',
          value:
            'Git tracks files, not folders, so a folder with nothing in it will never show up in a commit. If your project needs one anyway (say an empty `uploads/` folder), put an empty file called `.gitkeep` inside it and commit that. The name is a convention developers agreed on, not a Git feature — any file name would work.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'gitignore-patterns',
      title: 'Pattern syntax',
      content: [
        {
          type: 'text',
          value:
            'Three pieces of syntax cover almost everything you will write in a `.gitignore`:',
        },
        {
          type: 'list',
          items: [
            'An asterisk, as in `*.log`, is a wildcard standing in for any run of characters. This one line ignores `debug.log`, `server.log`, and every other file ending in `.log`.',
            'A trailing slash, as in `build/`, means "this is a folder". Git skips the folder and everything inside it, however deep.',
            'A leading `!` flips a rule back off, so `!error.log` rescues that one file. Put it after the broader rule that would have caught it.',
          ],
        },
        {
          type: 'code',
          language: 'text',
          value:
            '# Ignore every .log file\n*.log\n\n# ...except this one\n!error.log\n\n# Ignore the whole build folder\nbuild/',
        },
        {
          type: 'text',
          value:
            'Order matters for the `!` rule: the rescue line has to come *after* the line it is undoing. Reverse those two lines and `error.log` stays ignored.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-gitignore-pattern',
      question:
        'Your project keeps writing `debug.log`, `server.log`, and `error.log`. You add the single line `*.log` to your `.gitignore`. What happens to those three files?',
      options: [
        {
          text: 'Git deletes them from your folder so they stop cluttering it.',
          whyWrong:
            '`.gitignore` never deletes anything. The three files sit right where they are. Git only stops offering to commit them.',
        },
        {
          text: 'Nothing changes, because a pattern has to name a file exactly to match it.',
          whyWrong:
            'That would be true of the pattern `debug.log`, which matches one file. The `*` wildcard stands in for any characters, so `*.log` matches all three.',
        },
        {
          text: 'Git stops offering to commit all three, and they disappear from `git status`.',
        },
        {
          text: 'They are ignored until you run `git add .`, which adds everything and overrides the ignore rules.',
          whyWrong:
            '`git add .` respects `.gitignore` and skips ignored files. Adding an ignored file takes a deliberate `git add -f`.',
        },
      ],
      correctIndex: 2,
      explanation:
        'The `*` wildcard matches any run of characters, so `*.log` covers every file ending in `.log`, including ones you have not created yet. Ignoring is about what Git offers you, never about what is on your disk.',
    },
    {
      type: 'reading',
      id: 'already-tracked',
      title: 'Ignoring a file you already committed',
      content: [
        {
          type: 'text',
          value:
            'Ignoring a file you already committed may not come up on day one, but it catches almost everyone eventually. A `.gitignore` rule only applies to files Git is not already tracking. If you committed `.env` last week, adding it to `.gitignore` today changes nothing. Git keeps tracking it, and you have to untrack it yourself.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Stop tracking one file, keep it on disk\ngit rm --cached .env\n\n# Stop tracking a whole folder\ngit rm -r --cached node_modules/\n\n# Record the change\ngit commit -m "Stop tracking files that should be ignored"',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not drop the --cached flag',
          value:
            '`--cached` tells Git to remove the file from *tracking only* and leave your copy alone. Plain `git rm .env` removes it from tracking **and deletes it from your disk**. A file that was never committed in its current state is then gone for good. Read the command back before you press Enter.',
        },
        {
          type: 'text',
          value:
            'One more thing worth knowing: untracking stops the file from appearing in *future* commits, but the commits you already made still contain it. If that file held a real password, change the password. Removing it going forward does not un-share it.',
        },
      ],
    },
    {
      type: 'block-exercise',
      id: 'build-rm-cached',
      prompt:
        'You are in a project where `.env` is already tracked, so the new ignore rule has no effect on it. Build the command that stops tracking `.env` without deleting it from your disk:',
      availableBlocks: ['git', 'rm', 'add', '--cached', '--staged', '.env', '-r', 'restore'],
      correctAnswer: ['git', 'rm', '--cached', '.env'],
      hints: [
        'The command that removes a file from Git is `git rm`. You need the flag that stops it from touching your disk.',
        'That flag is `--cached`. The file name goes last.',
      ],
    },
    {
      type: 'reading',
      id: 'gitignore-templates',
      title: 'Start from a template',
      content: [
        {
          type: 'text',
          value:
            'Nobody writes a `.gitignore` from memory. Every language and editor litters your folder with its own files, and a good template already knows them all. Two places to get one:',
        },
        {
          type: 'list',
          items: [
            '**GitHub** offers a `.gitignore` for your language in a dropdown when you create a repository. You can also browse every template at [github/gitignore](https://github.com/github/gitignore).',
            '**gitignore.io** takes a different approach. At [gitignore.io](https://www.toptal.com/developers/gitignore) you type your operating system, editor, and language, and it builds a combined file you can copy and paste.',
          ],
        },
        {
          type: 'text',
          value:
            'Copy the template in, then add or delete lines to fit your project. A template covers cases you would not have thought of, and there is no penalty for ignoring something you never had.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'global-gitignore',
      title: 'A global .gitignore for your own machine',
      content: [
        {
          type: 'text',
          value:
            'Some rules are about you, not about the project. `.DS_Store` clutters every folder on a Mac. Your editor may scatter its own files everywhere. Rather than pushing your personal preferences into every project you touch, point Git at one **global** ignore file that applies to all of your repositories.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# macOS, Linux, or Git Bash on Windows\ngit config --global core.excludesFile ~/.gitignore_global\n\n# Windows PowerShell\ngit config --global core.excludesFile "$env:USERPROFILE\\.gitignore_global"',
        },
        {
          type: 'text',
          value:
            'Both lines say the same thing. `~` and `$env:USERPROFILE` are two ways of naming your home folder — the one holding Documents and Downloads. Pick the line for the terminal you are in. Then create a file named `.gitignore_global` in that folder and put your personal patterns inside it, one per line, exactly like a project `.gitignore`.',
        },
        {
          type: 'text',
          value:
            'Keep this file for machine-specific noise only. Anything your teammates also need to ignore belongs in the project `.gitignore`, where they will actually get it.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'checking-ignored',
      title: 'Checking what is being ignored',
      content: [
        {
          type: 'text',
          value:
            'Ignored files are invisible in `git status`. That is the point, but it also makes a broken rule hard to spot. Add the `--ignored` flag and Git lists what it is skipping:',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git status --ignored',
        },
        {
          type: 'text',
          value:
            'If a file you expected to see is missing from that list, your pattern is not matching it. Check for a typo, a missing trailing slash on a folder, or a rule sitting in the wrong repository.',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'check-ignored',
      prompt:
        'You are in a project whose `.gitignore` already covers `node_modules/`, `.env` and `.DS_Store`, and all three are sitting in the folder right now. Ask Git to show you which files it is ignoring:',
      expectedCommand: 'git status --ignored',
      acceptableVariants: [],
      successOutput:
        'On branch main\nIgnored files:\n  (use "git add -f <file>..." to include in what will be committed)\n\tnode_modules/\n\t.env\n\t.DS_Store',
      hints: [
        'Start from the command you already know for checking the state of your repository.',
        'It is `git status` with one extra flag: `--ignored`.',
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-already-tracked',
      question:
        'You committed `.env` last week. Today you add `.env` to `.gitignore` and save the file. What is the state of `.env` now?',
      options: [
        {
          text: 'The new rule untracks it, so it will not appear in future commits.',
          whyWrong:
            '`.gitignore` only applies to files Git is not already tracking. A file that has been committed stays tracked until you untrack it by hand.',
        },
        {
          text: 'Git keeps tracking it. You have to run `git rm --cached .env` and commit that to untrack it.',
        },
        {
          text: 'Git deletes `.env` from your folder, because ignored files are not allowed to exist.',
          whyWrong:
            'Nothing in `.gitignore` touches the files on your disk. It only changes what Git offers to commit, and ignored files sit in your folder as usual.',
        },
        {
          text: 'It stays tracked, but Git hides its contents from anyone who clones the repository.',
          whyWrong:
            'Git has no way to hide part of a tracked file. Anyone who clones the repository gets `.env` exactly as you committed it, which is precisely why untracking it matters.',
        },
      ],
      correctIndex: 1,
      explanation:
        '`.gitignore` is a filter on files Git has not seen before. Once a file is tracked, Git assumes you meant it and keeps following the file, so untracking is a deliberate step: `git rm --cached` takes it out of tracking while leaving your copy on disk.',
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
            'Write a `.gitignore` that keeps dependencies, secrets, build output, and OS junk out of your commits',
            'Read the three patterns that cover most cases: `*.log`, `build/`, and `!error.log`',
            'Untrack a file you already committed, without deleting your copy of it',
            'Start from a ready-made template instead of guessing what to ignore',
            'Set up one global ignore file for the noise your own machine makes',
            'Check what Git is skipping right now',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git status --ignored           # list the files Git is skipping\ngit rm --cached FILE           # stop tracking a file, keep it on disk\ngit rm -r --cached FOLDER      # same, for a whole folder\ngit add -f FILE                # add one ignored file anyway',
        },
        {
          type: 'text',
          value:
            'Next up: branching. You will learn how to work on a new idea in its own separate line of history, so the version that already works stays untouched while you experiment.',
        },
      ],
    },
  ],
} satisfies Lesson
