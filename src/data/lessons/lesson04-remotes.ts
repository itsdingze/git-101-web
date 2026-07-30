import type { Lesson } from '@/types'
export default {
  id: 4,
  title: 'Remotes & GitHub',
  description: 'Connect your local repo to the cloud',
  steps: [
    {
      type: 'reading',
      id: 'why-remotes',
      title: 'Time to go online',
      content: [
        {
          type: 'text',
          value:
            'Everything you have built so far lives in exactly one place: the computer in front of you. If that machine is lost, dropped, or reformatted, the project goes with it.',
        },
        {
          type: 'text',
          value:
            'In this lesson you put your project on **GitHub**, a website that stores Git projects for you. Once it is up there, your work is backed up, you can share it with a link, and other people can work on it with you.',
        },
        {
          type: 'text',
          value:
            'Your first push to GitHub is one of the most satisfying moments in learning Git, and you already know everything you need for it: `git init`, `git add`, and `git commit`. Three more steps and your code is online.',
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
            'Nothing moves between them on its own. Git talks to the remote only when you run a command that tells it to. That is worth remembering: work can be completely finished on your machine and still be invisible on GitHub.',
        },
        {
          type: 'text',
          value:
            'The first remote you connect is called **`origin`** by default. `origin` is a nickname for a long URL, so you can type one short word instead of `https://github.com/your-name/your-project.git` every single time. There is nothing magic about the word. It is the name Git picks by default.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git remote -v                  # list the remotes this project knows about\ngit remote add origin <url>    # give a URL the nickname "origin"',
        },
      ],
    },
    {
      type: 'reading',
      id: 'github-setup',
      title: 'Put your project on GitHub',
      content: [
        {
          type: 'text',
          value:
            'Three steps, in this order. Run the commands from inside your project folder, the one where you ran `git init`.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Sign in at [github.com](https://github.com), click the **+** in the top-right corner, and choose **New repository**. Give it a name, leave every "initialize this repository with" box unchecked so it is created completely empty, and click **Create repository**.',
            'GitHub now shows you a URL ending in `.git`. Copy it, and run `git remote add origin` followed by that URL. This is how your project learns where its remote lives.',
            'Run `git push -u origin main` to upload every commit you have made so far.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# step 2: paste your own URL here\ngit remote add origin https://github.com/your-username/your-repo.git\n\n# step 3: send your commits up\ngit push -u origin main',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'That first push will ask who you are',
          value:
            'GitHub has to check that you are allowed to write to this repository, so the push either opens a login prompt or is rejected outright. Your GitHub website password will not work. The next step covers how to log in properly. Jump to it the moment Git asks, then come back and run the push again.',
        },
        {
          type: 'text',
          value:
            'Once the push goes through, refresh the GitHub page. Your files are there, with your commit messages next to them. That is the milestone: your project is online and backed up.',
        },
        {
          type: 'text',
          value:
            'The `-u` in that last command sets up a shortcut so later pushes are shorter. We come back to it near the end of this lesson.',
        },
      ],
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
      id: 'authentication',
      title: 'Proving that you are you',
      content: [
        {
          type: 'text',
          value:
            'The first time you push, GitHub has to check that you are allowed to. Typing your GitHub website password will not work, because GitHub stopped accepting account passwords for Git over HTTPS in 2021. Here are your options, easiest first.',
        },
        {
          type: 'text',
          value:
            '**Start with the GitHub CLI.** The [GitHub CLI](https://cli.github.com) is an official tool called `gh`. You install it once, run one command, and it logs in through your browser and hands the credentials to Git for you. After that, pushing and pulling never ask you for anything.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# install it\n# macOS:   brew install gh\n# Windows: winget install --id GitHub.cli\n# Linux:   instructions at https://cli.github.com\n\ngh auth login   # opens your browser, then follow the prompts',
        },
        {
          type: 'text',
          value:
            '**HTTPS with a token.** If you would rather not install anything, GitHub accepts a **personal access token**. That is a long generated string that works as a password for Git only, and you can cancel it at any time. Create one under **Settings > Developer settings > Personal access tokens** on GitHub, then paste it when Git asks for a password. Your terminal will not show the characters as you paste, which is normal, not a failure.',
        },
        {
          type: 'text',
          value:
            'In other tutorials you will see addresses like `git@github.com:user/repo.git`. That is **SSH**, another way to log in — one that takes more setup and that you do not need today.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'github-identity',
      title: 'When GitHub does not recognise you',
      content: [
        {
          type: 'text',
          value:
            'Your code is up — but sometimes the commits are credited to a grey silhouette with no link to your profile, as if a stranger wrote them.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Your commits show up as an unknown user',
          value:
            'GitHub matches commits to accounts by email address. If the email stored in `git config user.email` is not listed on your GitHub account, GitHub cannot tell that the commit is yours. Add that exact email under **GitHub Settings > Emails** and GitHub links every past commit to your profile straight away. You do not have to redo any work.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config user.email    # shows the email Git stamps on your commits',
        },
        {
          type: 'text',
          value:
            'The other route is to point Git at the address your GitHub account already knows about, so your commits are stamped with it from now on.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global user.email "your-github-email@example.com"',
        },
        {
          type: 'text',
          value:
            'The two routes do different things, so pick the one that matches what you need. Adding the address under **GitHub Settings > Emails** links every commit you have already made, including the ones already pushed. Changing your Git config affects only the commits you make from then on, and it never relinks the old ones.',
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
            'It did not fail. Git said `1 file changed`, which is its way of confirming the commit was saved. It was saved on your computer, which is somewhere GitHub cannot see.',
        },
        {
          text: 'GitHub takes a few minutes to catch up after you commit.',
          whyWrong:
            'GitHub is not watching your computer at all, so there is nothing for it to catch up on. Waiting will not help, because commits move only when a command sends them.',
        },
        {
          text: 'The commit exists only on your computer. `git push` is what sends it to GitHub.',
        },
        {
          text: 'You forgot `git add`, so the change was never included in the commit.',
          whyWrong:
            'You did run `git add`, and `1 file changed` confirms the file made it in. The change is safely inside the commit. It is the commit that has not left your machine.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Committing and publishing are two separate acts. `git commit` saves a snapshot in your own copy of the project. `git push` is a deliberate second step that sends saved commits to the remote. That separation is a feature: it is why you can commit all afternoon on a plane with no internet.',
    },
    {
      type: 'reading',
      id: 'clone-push-pull',
      title: 'Living with a remote from here on',
      content: [
        {
          type: 'text',
          value:
            'The milestone is behind you. The rest of this lesson is the everyday part: what you will actually run next week, once the project has moved on and so have you.',
        },
        {
          type: 'text',
          value: 'Three commands cover almost all of it.',
        },
        {
          type: 'list',
          items: [
            '**`git clone <url>`** copies a whole project down from GitHub onto your machine, full history included. You run it once, in the folder where you want the project to appear. It replaces `git init` for projects that already exist, so you never need both.',
            '**`git push`** sends the commits you have finished up to the remote. Nothing leaves your machine until you run it.',
            '**`git pull`** brings down commits that appeared on the remote and folds them into the branch you are on.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git clone https://github.com/user/repo.git   # copy a project down\ngit push origin main                         # send your commits up\ngit pull origin main                         # bring their commits down',
        },
      ],
    },
    {
      type: 'terminal-exercise',
      id: 'clone-repo',
      prompt:
        "You are in your home folder, outside `my-project`, and you want your own copy of someone else's repository. Copy down the project at `https://github.com/user/repo.git`, which stands in for the real URL you would paste:",
      expectedCommand: 'git clone https://github.com/user/repo.git',
      acceptableVariants: [],
      successOutput:
        "Cloning into 'repo'...\nremote: Enumerating objects: 42, done.\nremote: Total 42 (delta 0), reused 0 (delta 0)\nReceiving objects: 100% (42/42), done.",
      hints: [
        'The command that copies a project down is git clone',
        'Follow git clone with the full URL, ending in .git',
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
            '`origin/main` in that middle command is not a folder or part of a URL. It is Git\'s own record of where `main` sat on the remote the last time you fetched, and it lives on your machine like everything else in your repository. Nothing refreshes it on its own, so it only catches up when you run `git fetch` or `git pull`.',
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
      title: 'What the `-u` was for',
      content: [
        {
          type: 'text',
          value:
            'Back at the milestone you ran `git push -u origin main`. The `-u` (short for `--set-upstream`) told Git that this local branch belongs with that branch on the remote. That pairing is called **tracking**.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# first push of a branch the remote has never seen:\ngit push -u origin feature-login\n\n# every push and pull after that:\ngit push\ngit pull',
        },
        {
          type: 'text',
          value:
            'Once a branch is tracked, `git push` and `git pull` already know where to go, so you can drop the remote and branch names. You need `-u` only the first time you push a given branch. To see which of your branches are paired with which remote branch, run `git branch -vv`.',
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
          text: 'The copy of the project sitting on your own computer.',
          whyWrong:
            'Your own copy needs no name, since it is where you already are. `origin` names the copy somewhere else, the one you are sending commits to.',
        },
      ],
      correctIndex: 1,
      explanation:
        "When you connect a project to GitHub, Git stores the URL under a short name so you never have to type the URL again, and `origin` is the name it uses by default. Nothing reserves that word: you can rename it, and a project can hold several remotes under different names, which is how contributing to other people's projects works.",
    },
    {
      type: 'reading',
      id: 'pull-divergent',
      title: 'A pull error you will meet one day',
      content: [
        {
          type: 'text',
          value:
            'One day `git pull` may stop and print this:',
        },
        {
          type: 'code',
          language: 'text',
          value: 'fatal: Need to specify how to reconcile divergent branches.',
        },
        {
          type: 'text',
          value:
            'Nothing is broken and nothing is lost. Git is asking you a question, not failing: the remote has commits you do not have, and you have commits the remote does not have. Answer once and Git stops asking. While you are learning, answer `false`, which combines the two sides with a merge and never rewrites your history.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config --global pull.rebase false',
        },
        {
          type: 'text',
          value:
            'That is a one-time setting per computer, not per project. Lesson 7 explains what that setting actually chose.',
        },
        {
          type: 'text',
          value:
            'On **Windows** the Git installer has usually answered this for you already, in the same silent way it picked a branch name back in lesson 1, so this error is mostly a macOS and Linux experience. Run `git config --get pull.rebase` to check. It prints `false` if the answer is already set, and nothing at all if it is not.',
        },
        {
          type: 'text',
          value:
            'You do not need any of this today. File it away, so that the day the error turns up you recognise it instead of panicking.',
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
            'Explain what a remote is, and why `origin` keeps showing up in commands',
            'Create an empty repository on GitHub and connect your local project to it',
            'Push your project online and see your files on the web',
            'Log in to GitHub from the terminal with the GitHub CLI, or with a personal access token',
            'Fix commits that show up on GitHub as an unknown user',
            'Say what separates committing from pushing, and fetching from pulling',
            'Recognise the divergent branches error and settle it with one setting',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'gh auth login                  # log in to GitHub from the terminal\ngit remote -v                  # list the remotes this project knows about\ngit remote add origin <url>    # give a URL the nickname "origin"\ngit push -u origin main        # first push, and pair the branch with the remote\ngit push                       # send new commits up, once the pairing exists\ngit pull                       # bring new commits down and combine them\ngit fetch origin               # look at what is new without touching your files\ngit clone <url>                # copy an existing project down from GitHub',
        },
        {
          type: 'text',
          value:
            'Next up: some files should never be pushed anywhere, such as passwords, huge build folders, and notes to yourself. Next lesson you write a `.gitignore` so Git stops offering to commit them.',
        },
      ],
    },
  ],
} satisfies Lesson
