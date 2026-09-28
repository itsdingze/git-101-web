import type { Lesson } from '@/types'
export default {
  id: 10,
  title: 'Remotes & GitHub',
  description: 'Keep a second copy of your project, and move commits between the two',
  unlocks: ['remote', 'clone', 'fetch', 'pull', 'push'],
  steps: [
    {
      type: 'reading',
      id: 'why-remotes',
      title: 'One copy is not enough',
      content: [
        {
          type: 'text',
          value:
            'Everything you have built so far lives in exactly one place. One folder, one copy, one machine. If that copy is lost, dropped, or reformatted, the project goes with it.',
        },
        {
          type: 'text',
          value:
            'A **remote** fixes that. It is a second copy of your project kept somewhere else, most often on **GitHub**, a website built for storing Git projects. Once a project has a remote, your work is backed up, you can hand someone a link to it, and other people can work on it alongside you.',
        },
        {
          type: 'text',
          value:
            'This lesson is about the traffic between the two copies. Which command moves commits, which direction it moves them in, and what each copy knows about the other.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'remotes-concept',
      title: 'What a remote is',
      content: [
        {
          type: 'text',
          value:
            "A **remote** is a copy of your project that lives on someone else's computer, usually GitHub's. You keep your copy, the remote keeps its own, and you send changes back and forth between the two.",
        },
        {
          type: 'text',
          value:
            'Nothing moves between them on its own. Git talks to the remote only when you run a command that tells it to. That is worth remembering: work can be completely finished in your copy and still be invisible on GitHub.',
        },
        {
          type: 'text',
          value:
            'The first remote a project connects to is called **`origin`** by default. `origin` is a nickname for a long URL, so you can type one short word instead of `https://github.com/your-name/your-project.git` every single time. There is nothing magic about the word. It is the name Git picks by default.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git remote -v                  # list the remotes this project knows about\ngit remote add origin <url>    # give a URL the nickname "origin"',
        },
        {
          type: 'text',
          value: '`git remote -v` prints one line per direction:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'origin\thttps://github.com/supper-club/cookbook.git (fetch)\norigin\thttps://github.com/supper-club/cookbook.git (push)',
        },
        {
          type: 'text',
          value:
            'Both lines say the same URL here, which is the normal case. Git lists them separately because a remote can in principle be read from one address and written to another.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-commit-vs-push',
      question:
        'You edited a file, ran `git add`, then `git commit`, and Git replied `1 file changed`. You refresh your GitHub page and the change is not there. What is going on?',
      options: [
        {
          text: 'The commit silently failed, so you need to run `git commit` again.',
          whyWrong:
            'It did not fail. Git said `1 file changed`, which is its way of confirming the commit was saved. It was saved in your copy of the project, which is somewhere GitHub cannot see.',
        },
        {
          text: 'GitHub takes a few minutes to catch up after you commit.',
          whyWrong:
            'GitHub is not watching your copy at all, so there is nothing for it to catch up on. Waiting will not help, because commits move only when a command sends them.',
        },
        {
          text: 'The commit exists only in your copy. `git push` is what sends it to GitHub.',
        },
        {
          text: 'You forgot `git add`, so the change was never included in the commit.',
          whyWrong:
            'You did run `git add`, and `1 file changed` confirms the file made it in. The change is safely inside the commit. It is the commit that has not left your copy.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Committing and publishing are two separate acts. `git commit` saves a snapshot in your own copy of the project. `git push` is a deliberate second step that sends saved commits to the remote. That separation is a feature: it is why you can commit all afternoon on a plane with no internet.',
    },
    {
      type: 'reading',
      id: 'clone-push-pull',
      title: 'Three commands move the commits',
      content: [
        {
          type: 'text',
          value: 'Almost everything you do with a remote is one of these three.',
        },
        {
          type: 'list',
          items: [
            '**`git clone <url>`** copies a whole project down, full history included. You run it once, in the folder where you want the project to appear. It replaces `git init` for projects that already exist, so you never need both.',
            '**`git push`** sends the commits you have finished up to the remote. Nothing leaves your copy until you run it.',
            '**`git pull`** brings down commits that appeared on the remote and folds them into the branch you are on.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git clone https://github.com/supper-club/cookbook.git   # copy a project down\ngit push origin main                                    # send your commits up\ngit pull origin main                                    # bring their commits down',
        },
        {
          type: 'text',
          value: 'A clone looks like this:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            "Cloning into 'cookbook'...\nremote: Enumerating objects: 7, done.\nremote: Counting objects: 100% (7/7), done.\nremote: Compressing objects: 100% (5/5), done.\nremote: Total 7 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)\nReceiving objects: 100% (7/7), done.",
        },
        {
          type: 'text',
          value:
            'Git names the new folder after the project, `cookbook` here, and leaves you standing where you were. Your next move is almost always `cd cookbook`. To choose the folder name yourself, put it on the end: `git clone <url> my-folder`.',
        },
        {
          type: 'text',
          value: 'A push reports what it sent, and where:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'Enumerating objects: 4, done.\nCounting objects: 100% (4/4), done.\nWriting objects: 100% (3/3), 344 bytes | 344.00 KiB/s, done.\nTo https://github.com/supper-club/cookbook.git\n   b34ffee..4e456cc  main -> main',
        },
        {
          type: 'text',
          value:
            'The last line is the useful one. `main -> main` means your `main` went to the remote `main`, and `b34ffee..4e456cc` is the stretch of history that travelled: the remote was sitting on `b34ffee` and now it is on `4e456cc`.',
        },
      ],
    },
    {
      type: 'sandbox-exercise',
      id: 'remote-round-trip',
      title: 'Practice: a full round trip',
      mode: 'guided',
      brief:
        'You are in `cookbook`, your copy of the supper club cookbook you keep with a friend. Two things are true. They pushed a soups chapter while you were away, so the remote is one commit ahead of you. And you have written `desserts.md`, which you have not committed yet. **Your goal: get up to date, publish your chapter, then prove it really left.**',
      seed: {
        dir: 'cookbook',
        remote: {
          name: 'origin',
          url: 'https://github.com/supper-club/cookbook.git',
          setup: [
            {
              write: {
                'bread.md': '# Bread\n\nSourdough, focaccia, soda bread.\n',
                'README.md': '# Cookbook\n\nRecipes we cook for each other.\n',
              },
            },
            { run: 'git add .' },
            { run: 'git commit -m "Initial commit"' },
          ],
          ahead: [
            { write: { 'soups.md': '# Soups\n\nLeek and potato, ribollita.\n' } },
            { run: 'git add .' },
            { run: 'git commit -m "Add a soups chapter"' },
          ],
        },
        setup: [
          { write: { 'desserts.md': '# Desserts\n\nTarts, ices, and one very good crumble.\n' } },
        ],
      },
      goals: [
        {
          id: 'pulled',
          label: 'Your `main` has the soups chapter your friend pushed',
          narration:
            'Start by catching up. Their commit is sitting on the remote and nothing has brought it down yet. One command downloads it and folds it into the branch you are on.',
          check: { kind: 'commit-exists', messageIncludes: 'soups chapter', onBranch: 'main' },
          hints: [
            'Their commit is on the remote. Getting it is a single command.',
            'The command that brings commits down and combines them in one go is `git pull`',
            'Run `git pull origin main`, then `ls` to see the new file arrive',
          ],
        },
        {
          id: 'committed',
          label: '`desserts.md` is saved in a commit',
          narration:
            'Now your own work. `desserts.md` is sitting in the folder untracked, and a remote can only ever receive commits. So make one first.',
          check: { kind: 'commit-exists', containing: ['desserts.md'], onBranch: 'main' },
          hints: [
            'Nothing can be pushed until it is committed',
            'Two commands: stage the file, then save the snapshot',
            'Run `git add desserts.md` then `git commit -m "Add the desserts chapter"`',
          ],
        },
        {
          id: 'pushed',
          label: 'That commit is on the remote',
          narration:
            'The commit exists, and it exists in exactly one place. Send it up. This copy came from `git clone`, which already paired `main` with the `main` on the remote, so a plain `git push` knows where to go.',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'commit-exists', containing: ['desserts.md'], onBranch: 'main' },
              { kind: 'pushed', branch: 'main' },
            ],
          },
          hints: [
            'One command sends finished commits to the remote',
            'Your `main` came from a clone, so it is already paired and the command needs no arguments',
            'Run `git push`',
          ],
        },
        {
          id: 'second-copy',
          label: 'A separate copy of the project sits in a folder called `check`',
          narration:
            'Last move, and it is the satisfying one. Go up to your home folder and clone the project again into a folder called `check`. That copy is built from the remote alone, so whatever you find in it is what the remote really holds.',
          check: { kind: 'clone-exists', path: 'check' },
          hints: [
            '`cd ~` first, so the new copy lands beside `cookbook` rather than inside it',
            'The command that copies a project down is `git clone`, and a folder name on the end chooses where it lands',
            'Run `git clone https://github.com/supper-club/cookbook.git check`, then `cd check` and `ls`',
          ],
        },
      ],
      completionMessage:
        '`check` was built from the remote and nothing else, and `desserts.md` is in it. That is proof the commit travelled. Notice what each command did on its own: `pull` moved commits down, `commit` saved locally, `push` moved commits up, `clone` built a whole copy from scratch.',
    },
    {
      type: 'block-exercise',
      id: 'build-push',
      prompt: 'Build the command that sends your commits to the `main` branch on `origin`:',
      availableBlocks: ['git', 'push', 'pull', 'origin', 'main', 'remote', 'clone', '-u'],
      correctAnswer: ['git', 'push', 'origin', 'main'],
      acceptableAnswers: [['git', 'push', '-u', 'origin', 'main']],
      hints: [
        'Four blocks: the program, the action, where it goes, and which branch',
        'The remote is called "origin" and the branch is called "main"',
      ],
    },
    {
      type: 'reading',
      id: 'fetch-vs-pull',
      title: 'Fetch versus pull',
      content: [
        {
          type: 'text',
          value:
            '`git pull` is really two actions in one. It **fetches** the new commits from the remote, then **combines** them with the branch you are on. You can do the first half by itself when you want to look before you leap:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git fetch origin        # download the new commits, change nothing\ngit log origin/main     # read what other people did\ngit pull origin main    # combine when you are ready',
        },
        {
          type: 'text',
          value:
            'A fetch says almost nothing on its own. Ask `git status` afterwards and you get the real news:',
        },
        {
          type: 'code',
          language: 'text',
          value:
            'On branch main\nYour branch is behind \'origin/main\' by 1 commit, and can be fast-forwarded.\n  (use "git pull" to update your local branch)\n\nnothing to commit, working tree clean',
        },
        {
          type: 'text',
          value:
            'Your files have not changed. Only your knowledge has. Git now knows there is one commit waiting, and it is telling you which command collects it.',
        },
        {
          type: 'text',
          value:
            "`origin/main` in that message is not a folder or part of a URL. It is Git's own record of where `main` sat on the remote the last time you fetched, and it lives in your copy like everything else in your repository. Nothing refreshes it on its own, so it only catches up when you run `git fetch` or `git pull`.",
        },
        {
          type: 'text',
          value:
            'That is why `git status` can happily report you are up to date while the remote has moved on. It is not lying. It is comparing you against a record that is a day old.',
        },
        {
          type: 'text',
          value:
            "The same record covers the remote's other branches. `git branch` on its own lists only your branches. Add `-a`, for *all*, and Git lists the remote's branches underneath them:",
        },
        {
          type: 'code',
          language: 'text',
          value: '$ git branch -a\n* main\n  remotes/origin/main\n  remotes/origin/soups-chapter',
        },
        {
          type: 'text',
          value:
            'That list is a snapshot from your last fetch or pull, not a live view. A branch your friend pushed five minutes ago will not appear in it until you run `git fetch`, which refreshes it.',
        },
        {
          type: 'text',
          value:
            '`git fetch` is always safe. It never edits your files and never moves your branch. All it does is update what Git knows about the remote. Reach for it when you want to check whether anything has changed without letting it into your project yet.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'upstream-tracking',
      title: 'What `-u` is for',
      content: [
        {
          type: 'text',
          value:
            'The first push of a branch is usually written `git push -u origin main`. The `-u`, short for `--set-upstream`, tells Git that this local branch belongs with that branch on the remote. That pairing is called **tracking**, and Git confirms it on the spot:',
        },
        {
          type: 'code',
          language: 'text',
          value: "branch 'main' set up to track 'origin/main'.",
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# first push of a branch the remote has never seen:\ngit push -u origin desserts-chapter\n\n# every push and pull after that:\ngit push\ngit pull',
        },
        {
          type: 'text',
          value:
            'Once a branch is tracked, `git push` and `git pull` already know where to go, so you can drop the remote and branch names. You need `-u` only the first time you push a given branch. `git clone` sets up the pairing for the branch it hands you, which is why a plain `git push` was enough in the practice.',
        },
        {
          type: 'text',
          value:
            'Tracking is also what lets `git status` count for you. A tracked branch gets a line like `Your branch is up to date with \'origin/main\'`, or `ahead by 2 commits` when you have work still to send.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-origin',
      question: 'In the command `git push origin main`, what is `origin`?',
      options: [
        {
          text: 'The name of the branch the commits are being pushed to.',
          whyWrong:
            'That is `main`, the word after it. `origin` answers "where do these commits go?" and `main` answers "which branch?"',
        },
        {
          text: "The nickname for the remote copy of the project, the GitHub repository's URL.",
        },
        {
          text: 'The very first commit in the history, the one everything else grew from.',
          whyWrong:
            'Git has no special name for the first commit. `origin` is about a remote copy of the project, not about a point in history.',
        },
        {
          text: 'The copy of the project you are working in right now.',
          whyWrong:
            'The copy you are in needs no name, since it is where you already are. `origin` names the copy somewhere else, the one you are sending commits to.',
        },
      ],
      correctIndex: 1,
      explanation:
        "When you connect a project to GitHub, Git stores the URL under a short name so you never have to type the URL again, and `origin` is the name it uses by default. Nothing reserves that word: you can rename it, and a project can hold several remotes under different names, which is how contributing to other people's projects works.",
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
            'Explain what a remote is, and why `origin` keeps showing up in commands',
            'Copy an existing project down with `git clone`, and choose the folder it lands in',
            'Say what separates committing from pushing, and why finished work can still be invisible online',
            'Send commits up with `git push` and bring them down with `git pull`',
            'Look at what is new with `git fetch` before letting any of it into your files',
            'Read `origin/main` as your own record of where the remote was, not as a live view of it',
            'Say what `-u` sets up, and why one branch needs it only once',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git remote -v                  # list the remotes this project knows about\ngit remote add origin <url>    # give a URL the nickname "origin"\ngit clone <url>                # copy an existing project down\ngit clone <url> my-folder      # copy it down into a folder you name\ngit push -u origin main        # first push of a branch, and pair it with the remote\ngit push                       # send new commits up, once the pairing exists\ngit pull                       # bring new commits down and combine them\ngit fetch origin               # update what Git knows about the remote, change nothing\ngit branch -a                  # list your branches and the remote ones, as of your last fetch\ngit log origin/main           # read what arrived, before you combine it',
        },
        {
          type: 'text',
          value:
            'Next up: what happens when the remote is shared with other people. Feature branches, pull requests, and the rules a branch everyone depends on needs.',
        },
      ],
    },
  ],
} satisfies Lesson
