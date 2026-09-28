import type { Lesson } from '@/types'
export default {
  id: 4,
  title: '.gitignore',
  description: 'Tell Git which files to ignore',
  unlocks: ['rm'],
  steps: [
    {
      type: 'reading',
      id: 'why-gitignore',
      title: 'Why ignore files?',
      content: [
        {
          type: 'text',
          value:
            'Not every file in your project folder belongs in Git. Some are created automatically by other tools, some hold passwords, and some are junk your operating system leaves behind. Committing them makes your history noisy, and some of them cause real trouble later.',
        },
        {
          type: 'text',
          value: 'The usual suspects you should keep out of Git:',
        },
        {
          type: 'list',
          items: [
            '**Dependencies** are anything a tool downloaded for you and can download again: cached data sets from a server, or, if your project is code, the `node_modules/` folder and its tens of thousands of library files. One command brings it all back, so there is no reason to store it.',
            '**Secret settings** live in files like `.env`, which hold passwords and API keys. An **API key** is a password one piece of software uses to talk to another service. Commit one and it is in your history from then on, for anyone who ever gets a copy of the project.',
            '**Operating system junk** means `.DS_Store` on macOS and `Thumbs.db` on Windows. Your OS writes these to remember folder layouts. They mean nothing to your project.',
            '**Lock files from open documents** are the `~$report.docx` and `~$budget.xlsx` that Word and Excel create while a file is open. They vanish when you close the document, so a committed one is a ghost everyone else has to wonder about.',
            '**Generated output** is anything a machine rebuilds from something you already keep. A thesis written in LaTeX leaves `.aux`, `.log`, and `.synctex.gz` beside every chapter. R leaves an `.Rhistory`. Design work leaves exported renders, which are often enormous. Code lands its build in `dist/` or `build/`. Keep the source, drop what comes out of it.',
          ],
        },
        {
          type: 'text',
          value:
            'Git will not guess any of this for you. You tell it what to skip, in a file called `.gitignore`. Doing it now, while a project is young, is much easier than doing it after the wrong file is already recorded.',
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
            'A `.gitignore` file is a plain text file listing what Git should skip, one **pattern** per line. A pattern is a file name, a folder name, or a name with a wildcard in it. Create the file in the top folder of your repository, the folder that holds the hidden `.git` folder. Name it exactly `.gitignore`, dot included.',
        },
        {
          type: 'code',
          language: 'text',
          value:
            '# Secret settings\n.env\n.env.local\n\n# OS junk\n.DS_Store\nThumbs.db\n\n# Word and Excel lock files\n~$*.doc*\n~$*.xls*\n\n# Generated output\ndist/\nbuild/\n*.aux\n*.synctex.gz\n\n# Downloaded material\nnode_modules/',
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
            'The `.gitignore` file is the one file on this topic that you *do* want in Git. Committing it means everyone who ever gets a copy of your project gets the same ignore rules, so nobody re-adds `node_modules/` by mistake. Add and commit it early. In a new repository it belongs in one of the first commits, before any of the files it is meant to keep out.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keeping an empty folder',
          value:
            'Git tracks files, not folders, so a folder with nothing in it will never show up in a commit. If your project needs one anyway (say an empty `uploads/` folder), put an empty file called `.gitkeep` inside it and commit that. The name is a convention people agreed on rather than a Git feature. Any file name would do the same job.',
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
            'Order matters for the `!` rule. The rescue line has to come *after* the line it is undoing. Reverse those two lines and `error.log` stays ignored.',
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
          language: 'text',
          value:
            '$ git status --ignored\nOn branch main\nIgnored files:\n  (use "git add -f <file>..." to include in what will be committed)\n\tdebug.log\n\terror.log\n\tnode_modules/\n\nnothing to commit, working tree clean',
        },
        {
          type: 'text',
          value:
            'If a file you expected to see is missing from that list, something is off. Check for a typo, a missing trailing slash on a folder, or a rule sitting in the wrong repository. There is one more reason a file can go missing from the list, and it is the subject of the next step.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Adding an ignored file on purpose',
          value:
            'Now and then you want one ignored file in the project after all. Plain `git add` refuses it and tells you so: "The following paths are ignored by one of your .gitignore files". Force it in with `git add -f error.log`. From that point Git tracks the file, and the rule stops applying to it.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'already-tracked',
      title: 'Ignoring a file you already committed',
      content: [
        {
          type: 'text',
          value:
            'This is the single most important thing to know about `.gitignore`, and the thing that trips up almost everyone. **A rule only affects files Git is not already tracking.** If you committed `.env` last week, adding it to `.gitignore` today changes nothing. Git keeps tracking it, keeps showing your edits to it, and keeps putting it in every commit.',
        },
        {
          type: 'text',
          value:
            'You can see the rule failing to bite. Run `git status --ignored` and `.env` is not in the ignored list at all, because a tracked file is never ignored. To make the rule apply, you have to untrack the file yourself.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Stop tracking one file, keep it on disk\ngit rm --cached .env\n\n# Stop tracking a whole folder\ngit rm -r --cached node_modules/\n\n# Record the change\ngit commit -m "Stop tracking files that should be ignored"',
        },
        {
          type: 'text',
          value:
            'Once that commit lands, the file is untracked, the rule finally applies, and `.env` moves into the ignored list where you wanted it all along.',
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
            'One more thing worth knowing. Untracking stops the file from appearing in *future* commits, but the commits you already made still contain it. If that file held a real password, change the password. Removing it going forward does not un-share it.',
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
      type: 'sandbox-exercise',
      id: 'ignore-rules-in-practice',
      title: 'Practice: make the rules bite',
      mode: 'guided',
      brief:
        'Below is `my-project`, which happens to be software. Its `.gitignore` is already written, and it ignores `node_modules/`, `.env`, and `*.log`. Sitting in the folder right now are `node_modules/`, `debug.log`, and `error.log`, none of which Git has ever tracked. There is also `.env`, which was committed before the ignore rules were written. You are going to force one ignored file in, and rescue the one the rules cannot touch.',
      seed: {
        dir: 'my-project',
        setup: [
          { run: 'git init' },
          {
            write: {
              'index.html': '<h1>Hello</h1>\n',
              'app.js': 'startServer()\n',
              '.env': 'API_KEY=super-secret\n',
            },
          },
          { run: 'git add .' },
          { run: 'git commit -m "Initial commit"' },
          {
            write: {
              '.gitignore':
                '# Dependencies\nnode_modules/\n\n# Secret settings\n.env\n\n# Logs\n*.log\n',
            },
          },
          { run: 'git add .gitignore' },
          { run: 'git commit -m "Add ignore rules"' },
          {
            write: {
              'node_modules/left-pad/index.js': 'module.exports = 1\n',
              'debug.log': 'starting up\n',
              'error.log': 'boom\n',
            },
          },
        ],
      },
      goals: [
        {
          id: 'forced-in',
          label: '`error.log` is staged, despite the `*.log` rule',
          narration:
            'Start with `git status`. It says the working tree is clean, even though `ls` will show you a folder full of files. Now run `git status --ignored` to see the three Git is skipping. You have decided you want `error.log` in the project after all, so add it. Plain `git add error.log` will refuse, and its message tells you which flag overrides the refusal.',
          check: { kind: 'files-staged', paths: ['error.log'] },
          hints: [
            'Look at what Git prints when you try `git add error.log`. The hint line names the flag.',
            'The flag is `-f`, short for force.',
            'Run `git add -f error.log`.',
          ],
        },
        {
          id: 'log-committed',
          label: '`error.log` is saved in a commit',
          narration:
            'It went in. Run `git status` and you will see `error.log` staged like any ordinary file. Commit it, then run `git status --ignored` again and watch `error.log` drop out of the ignored list. Git is now tracking it, so the rule no longer applies to it.',
          check: { kind: 'commit-exists', containing: ['error.log'] },
          hints: [
            'The saving command needs a message.',
            'Run `git commit -m "Track the error log on purpose"`.',
          ],
        },
        {
          id: 'env-untracked',
          label: '`.env` is no longer tracked',
          narration:
            'Now for `.env`. The `.gitignore` names it, but `.env` was committed before that rule existed, and it is nowhere in the ignored list. Tracking wins. Untrack it, without deleting your copy from the folder.',
          check: { kind: 'file-untracked', path: '.env' },
          hints: [
            'The command removes the file from Git, and one flag stops it from touching your disk.',
            'It is `git rm` with the `--cached` flag.',
            'Run `git rm --cached .env`.',
          ],
        },
        {
          id: 'env-ignored',
          label: 'The untracking is committed, and `.env` is finally ignored',
          narration:
            'Untracking is a change like any other, so it needs a commit. Make it, then run `git status --ignored` one last time. `.env` is sitting in the ignored list, still safe in your folder, and it will never be offered to you again.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'file-ignored', path: '.env' },
              { kind: 'working-tree-clean' },
            ],
          },
          hints: [
            'Commit the staged removal.',
            'Run `git commit -m "Stop tracking .env"`.',
          ],
        },
      ],
      completionMessage:
        'That is the whole of `.gitignore` in one folder. A rule decides what Git offers you, `-f` overrides it in one direction, and `git rm --cached` overrides it in the other. Everything you did left every file exactly where it was on disk. Run `git log --oneline` and `git status --ignored` below to see where you ended up.',
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
          text: 'It stays tracked, but Git hides its contents from anyone who gets a copy of the repository.',
          whyWrong:
            'Git has no way to hide part of a tracked file. Anyone who gets a copy of the repository gets `.env` exactly as you committed it, which is precisely why untracking it matters.',
        },
      ],
      correctIndex: 1,
      explanation:
        '`.gitignore` is a filter on files Git has not seen before. Once a file is tracked, Git assumes you meant it and keeps following the file, so untracking is a deliberate step. `git rm --cached` takes it out of tracking while leaving your copy on disk.',
    },
    {
      type: 'reading',
      id: 'gitignore-templates',
      title: 'Start from a template',
      content: [
        {
          type: 'text',
          value:
            'Nobody writes a `.gitignore` from memory. Every tool you use litters your folder with its own files, and a good template already knows them all. Two places to get one:',
        },
        {
          type: 'list',
          items: [
            '**GitHub** keeps a template for almost every tool at [github/gitignore](https://github.com/github/gitignore), covering writing tools like LaTeX as well as programming languages. Open the one that matches your work and copy its lines into your own `.gitignore`.',
            '**gitignore.io** takes a different approach. At [gitignore.io](https://www.toptal.com/developers/gitignore) you type the names of the tools you work with, and it builds a combined file you can copy and paste.',
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
      id: 'recap',
      title: 'Recap',
      content: [
        { type: 'text', value: 'You can now:' },
        {
          type: 'list',
          items: [
            'Write a `.gitignore` that keeps downloaded material, secrets, generated output, and OS junk out of your commits',
            'Read the three patterns that cover most cases: `*.log`, `build/`, and `!error.log`',
            'Check what Git is skipping right now, and spot a rule that is not matching',
            'Force one ignored file in when you actually want it',
            'Say why a rule does nothing to a file you already committed, and untrack that file without deleting your copy',
            'Start from a ready-made template instead of guessing what to ignore',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git status --ignored           # list the files Git is skipping\ngit add -f FILE                # add one ignored file anyway\ngit rm --cached FILE           # stop tracking a file, keep it on disk\ngit rm -r --cached FOLDER      # same, for a whole folder',
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
