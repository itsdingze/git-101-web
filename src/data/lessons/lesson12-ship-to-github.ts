import type { Lesson } from '@/types'
export default {
  id: 12,
  title: 'Ship It to GitHub',
  description: 'Set Git up on your own machine and put a real project online',
  unlocks: [],
  steps: [
    {
      type: 'reading',
      id: 'the-real-thing',
      title: 'Time to do it for real',
      content: [
        {
          type: 'text',
          value:
            'The core loop here is one you have practised: `git init`, `git add`, `git commit`, `git push`. `git remote add` you have only read about, because the practice project came with `origin` already set up, so this is your first time running it. A few setup commands are new too, like `gh auth login` and a handful of one-time settings, and each is explained where it appears.',
        },
        {
          type: 'text',
          value:
            'What changes is where you run them. This lesson sets Git up on your own computer and puts a project of yours on GitHub, under your name, on the internet.',
        },
        {
          type: 'text',
          value:
            'Nothing here is checked. Work through it in order, in one sitting, and you finish with a repository you can send someone a link to.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Install Git and confirm it answers.',
            'Tell Git your name, your email, and that new branches are called `main`.',
            'Make a GitHub account and an empty repository.',
            'Log in to GitHub from your terminal.',
            'Push a project of your own up to it.',
            'Open a pull request against yourself, and merge it.',
          ],
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
          value: 'There are two ways to install Git.',
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
            'A **package manager** is a command-line tool that installs, updates, and removes software for you. Think of it as an app store you control by typing. You do not need one to install Git, but most people who work in a terminal prefer it. One command to install, one command to update, and everyone around you can run the same setup.',
        },
        {
          type: 'text',
          value:
            'On **macOS**, Git comes pre-installed on most Macs, and that copy is usually years out of date. The recommended way to get the current version is [Homebrew](https://brew.sh), the most popular package manager for macOS. If you do not have Homebrew yet, its [website](https://brew.sh) has the installation guide.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'brew install git',
        },
        {
          type: 'text',
          value:
            'On **Windows**, download the installer from [git-scm.com](https://git-scm.com/download/win) and click through it. The defaults are fine. It also installs **Git Bash**, a terminal that understands the commands in this course.',
        },
        {
          type: 'text',
          value:
            'If PowerShell or Windows Terminal is already open, one command does the same job, using [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), the package manager built into Windows 10 and 11. Git Bash still comes with it.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'winget install --id Git.Git -e --source winget',
        },
        {
          type: 'text',
          value: "On **Linux**, use your distribution's package manager.",
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Ubuntu / Debian\nsudo apt install git\n\n# Fedora\nsudo dnf install git\n\n# Arch Linux\nsudo pacman -S git',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Windows: open Git Bash, not PowerShell',
          value:
            'PowerShell and Command Prompt speak a different command language from the one every Git guide is written in. Press the Start key, type `Git Bash`, press Enter, and the snippets you copy will work as printed. Anywhere this lesson gives a PowerShell line as well, it is labelled.',
        },
        {
          type: 'text',
          value:
            'Now open a fresh terminal, so it picks up the new installation, and check that Git answers you.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git --version',
        },
        {
          type: 'text',
          value:
            'A version number back means Git is installed and your terminal can find it. Any recent version is fine. A "command not found" message usually means the terminal was already open when you installed. Close it and open a new one.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'identity',
      title: 'Tell Git who you are',
      content: [
        {
          type: 'text',
          value:
            'Every commit is stamped with a name and an email. These are the same two `git config` commands from How You\'ll Work, now run for real on your own machine. Set them once and Git uses them for every project on it.',
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
          title: 'Use the email your GitHub account will use',
          value:
            'The name is a label for humans, so use your real one or the one your teammates know. The email matters more. GitHub decides which commits belong to you by matching this address against the ones on your account, so put the address you are about to sign up with here.',
        },
        {
          type: 'text',
          value:
            'One more setting. The first line of work in a new project is a branch, and it needs a name. Every command you have run in this course names it `main`, so make that the default before you create anything.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config --global init.defaultBranch main',
        },
        {
          type: 'text',
          value:
            'Left alone, Git may call that first branch `master` instead, and then `git push -u origin main` fails because there is no branch by that name to send. On **macOS** and **Linux**, Git also prints a block of `hint:` advice about the branch name every time you start a project until you make the choice yourself. On **Windows** the installer usually wrote `master` into a machine-wide settings file already, so there is no advice to see and no question asked. The command above overrides all of that.',
        },
        {
          type: 'text',
          value:
            'The setting applies to projects you create from now on. If you already have a repository of your own, check it from inside its folder.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git branch                 # what is this project\'s branch called?\ngit branch -m master main  # rename it, if the answer was master',
        },
      ],
    },
    {
      type: 'reading',
      id: 'github-repository',
      title: 'An account and an empty repository',
      content: [
        {
          type: 'text',
          value:
            'Sign up at [github.com](https://github.com) if you have not already. Use the same email address you just gave Git.',
        },
        {
          type: 'text',
          value:
            'Then click the **+** in the top-right corner and choose **New repository**. Give it a name. Leave every "initialize this repository with" box unchecked, so it is created completely empty, and click **Create repository**.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Empty means empty',
          value:
            'Ticking "Add a README" makes GitHub create a commit of its own. Your project has commits GitHub has never seen, GitHub has a commit you have never seen, and your first push is rejected before it starts. An empty repository has nothing to disagree with.',
        },
        {
          type: 'text',
          value:
            'GitHub now shows you a page of setup instructions with a URL ending in `.git` at the top. That URL is the address of your remote. Keep the tab open.',
        },
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
            'Before you can push, GitHub has to check that you are allowed to write to that repository. Your GitHub website password will not work, because GitHub stopped accepting account passwords for Git over HTTPS in 2021. Here are the options, easiest first.',
        },
        {
          type: 'text',
          value:
            '**Start with the GitHub CLI.** The [GitHub CLI](https://cli.github.com) is an official tool called `gh`. Install it once, run one command, and it logs in through your browser and hands the credentials to Git for you. Pushing and pulling never ask you for anything again.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# macOS:   brew install gh\n# Windows: winget install --id GitHub.cli\n# Linux:   instructions at https://cli.github.com\n\ngh auth login   # opens your browser, then follow the prompts',
        },
        {
          type: 'text',
          value:
            'Answer `GitHub.com`, then `HTTPS`, then yes to authenticating Git with your GitHub credentials, then log in with a web browser. That last answer prints a short code and opens the browser for you to paste it into.',
        },
        {
          type: 'text',
          value:
            '**Or use a personal access token.** If you would rather install nothing, GitHub accepts a **personal access token** in place of a password. It is a long generated string that works for Git only, and you can revoke it at any time without touching your account. Create one under **Settings > Developer settings > Personal access tokens**, give it the `repo` scope, and copy it somewhere safe, because GitHub shows it once.',
        },
        {
          type: 'text',
          value:
            'When Git asks for a password, paste the token. Your terminal will not show any characters as you paste. That is normal, not a failure. Press Enter.',
        },
        {
          type: 'text',
          value:
            'In other guides you will see addresses like `git@github.com:user/repo.git`. That is **SSH**, a third way to log in. It takes more setup, it is a fine thing to learn later, and you do not need it today.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-auth',
      question:
        'You run `git push` for the first time. Git asks for a username and password, you type your GitHub login, and it is rejected. What happened?',
      options: [
        {
          text: 'GitHub no longer accepts account passwords for Git, so you need `gh auth login` or a personal access token instead.',
        },
        {
          text: 'Your password is wrong. Reset it on the GitHub website and try the push again.',
          whyWrong:
            'The password itself is fine for logging in to the website. Git over HTTPS is the part that stopped accepting it, so a new password gets rejected exactly the same way.',
        },
        {
          text: 'The repository is private, and private repositories cannot be pushed to from a terminal.',
          whyWrong:
            'Private repositories push from a terminal like any other. Authentication is the gate here, not visibility.',
        },
        {
          text: 'You have to be logged in to github.com in your browser before Git will let you push.',
          whyWrong:
            'Git does not read your browser or its cookies. It sends credentials of its own, which is why it needs a token or the GitHub CLI.',
        },
      ],
      correctIndex: 0,
      explanation:
        'GitHub retired password authentication for Git in 2021. `gh auth login` logs in through your browser once and stores the credentials for Git, which is why it is the easiest route. A personal access token does the same job by hand: paste it where Git asks for a password.',
    },
    {
      type: 'reading',
      id: 'push-your-project',
      title: 'Push a project of your own',
      content: [
        {
          type: 'text',
          value:
            'Pick a folder on your machine with something real in it. Anything you make counts here: a book you are drafting, a folder of design work, your notes, a set of research data, a recipe collection, a website, a half-finished script. If losing it would ruin your week, it belongs in Git. Open a terminal and `cd` into it.',
        },
        {
          type: 'text',
          value: 'Then run the loop you already know.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git init\ngit add .\ngit commit -m "Initial commit"\ngit remote add origin https://github.com/your-username/your-repo.git\ngit push -u origin main',
        },
        {
          type: 'text',
          value:
            'Paste your own URL into the fourth line, the one from the GitHub tab you left open. If the folder is already a repository, skip `git init` and start at `git add`.',
        },
        {
          type: 'text',
          value:
            'The `-u` pairs your local `main` with `main` on the remote, so every push and pull after this one is just `git push` or `git pull` with nothing after it.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Before you stage everything',
          value:
            'Run `git status` and read what `git add .` is about to sweep up. If a set of credentials, a folder of huge exports, or anything private to you is in that list, write a `.gitignore` first and commit that. It is far easier than removing a secret from a repository that is already online.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'see-it-online',
      title: 'Refresh the page',
      content: [
        {
          type: 'text',
          value:
            'Go back to your GitHub tab and refresh it. The setup instructions are gone, and your files are sitting there with your commit message next to them.',
        },
        {
          type: 'text',
          value:
            'That is your work, on the internet, backed up, with a link you can send to anyone. Everything from here is an extra.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'pull-request',
      title: 'Open a pull request against yourself',
      content: [
        {
          type: 'text',
          value:
            'You know what a pull request is. Opening one on your own repository is the cheapest way to see the review flow from the inside, with nobody waiting on you.',
        },
        {
          type: 'text',
          value: 'Back in your project folder, make a small change on a branch and push it.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch -c update-readme\n# edit a file, or add a README\ngit add .\ngit commit -m "Add a README"\ngit push -u origin update-readme',
        },
        {
          type: 'text',
          value:
            'Refresh GitHub. A yellow banner offers **Compare & pull request**. Click it, write a title and a sentence of description, and open the pull request.',
        },
        {
          type: 'text',
          value:
            'Now read your own diff under the **Files changed** tab. This is exactly what a reviewer sees, which is worth knowing before you ask someone else to read one. Leave a comment on a line if you want to feel the whole thing work. Then click **Merge pull request**, and delete the branch when GitHub offers.',
        },
        {
          type: 'text',
          value: 'Your machine does not know any of this happened yet. Bring the merge home.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch main\ngit pull\ngit branch -d update-readme',
        },
      ],
    },
    {
      type: 'reading',
      id: 'unknown-user',
      title: 'When your commits show up as a stranger',
      content: [
        {
          type: 'text',
          value:
            'Sometimes your commits are credited to a grey silhouette with no link to your profile, as if someone else wrote them.',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'GitHub matches commits to accounts by email',
          value:
            'If the address in `git config user.email` is not on your GitHub account, GitHub cannot tell that the commit is yours. Add that exact address under **GitHub Settings > Emails** and every past commit links to your profile straight away. No work is redone.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config user.email    # the email Git stamps on your commits',
        },
        {
          type: 'text',
          value:
            'The other route is to point Git at an address your GitHub account already knows about.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git config --global user.email "your-github-email@example.com"',
        },
        {
          type: 'text',
          value:
            'The two routes do different things. Adding the address on GitHub relinks every commit you have already made, including the ones already pushed. Changing your Git config affects only commits made from now on, and never relinks the old ones.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-commit-email',
      question:
        'Your last twenty commits are on GitHub under a grey silhouette instead of your profile picture. You want those twenty linked to your account. What fixes them?',
      options: [
        {
          text: 'Add the email from `git config user.email` to your GitHub account under Settings > Emails.',
        },
        {
          text: 'Run `git config --global user.email` with your GitHub address, then push again.',
          whyWrong:
            'That is the right command for future commits, but the email is baked into each of the twenty commits already made. Pushing again sends the same commits with the same old address.',
        },
        {
          text: 'Rename your GitHub account so the username matches your Git `user.name`.',
          whyWrong:
            'GitHub never matches on the name. The name is free text that anyone can type, so it links nothing.',
        },
        {
          text: 'Delete the repository and push it again once your identity is set correctly.',
          whyWrong:
            'The commits would arrive carrying the same stamped email and look exactly as anonymous. It also throws away your issues, pull requests, and link, for nothing.',
        },
      ],
      correctIndex: 0,
      explanation:
        'An email address is stamped into a commit when it is made, and GitHub reads that stamp to find an owner. Teaching your account about the address you were already using claims all twenty at once. Changing the Git config is worth doing too, so the next twenty are right at the source.',
    },
    {
      type: 'reading',
      id: 'divergent-pull',
      title: 'The pull error you will meet one day',
      content: [
        {
          type: 'text',
          value: 'One day `git pull` stops, prints a block of hints, and ends with this line.',
        },
        {
          type: 'code',
          language: 'text',
          value: 'fatal: Need to specify how to reconcile divergent branches.',
        },
        {
          type: 'text',
          value:
            'Nothing is broken and nothing is lost. Git is asking a question. The remote has commits you do not have, and you have commits the remote does not have, so it wants to know whether to merge them or rebase them. Answer once and it stops asking. Answer `false`, which combines the two sides with a merge and never rewrites your history.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git config --global pull.rebase false\ngit config --get pull.rebase    # prints false once the answer is set',
        },
        {
          type: 'text',
          value:
            'That is one setting per computer, not per project. On **Windows** the Git installer has usually answered it for you already, so this is mostly a macOS and Linux surprise.',
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
            'Some ignore rules are about you, not about the project. `.DS_Store` clutters every folder on a Mac. Editors scatter files of their own. Rather than pushing your personal preferences into every repository you touch, point Git at one **global** ignore file that applies to all of them.',
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
            'Both lines say the same thing. `~` and `$env:USERPROFILE` both name your home folder, the one holding Documents and Downloads. Pick the line for the terminal you are in. Then create a file called `.gitignore_global` in that folder and put your personal patterns inside it, one per line, exactly like a project `.gitignore`.',
        },
        {
          type: 'text',
          value:
            'Keep it to machine-specific noise. Anything your teammates also need ignored belongs in the project `.gitignore`, where they will actually get it.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'clear-history',
      title: 'Starting a personal project fresh',
      content: [
        {
          type: 'text',
          value:
            'Here is a situation with no mistake in it. The repository is yours alone, it has never been shared, and its history is a pile of experiments you would rather not publish. You want the files as they are today, with one tidy commit behind them.',
        },
        {
          type: 'text',
          value:
            'The `.git` folder holds the entire memory of a repository. Delete it and your files stay exactly as they are. Only the history goes. Then start a fresh repository in the same folder.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# macOS, Linux, or Git Bash on Windows\nrm -rf .git\n\n# Windows PowerShell\nRemove-Item -Recurse -Force .git\n\ngit init\ngit add .\ngit commit -m "Initial commit"',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'There is no undo for this',
          value:
            'Every commit, every branch, and the reflog go together, so nothing is left to recover from. If the project was ever pushed anywhere, the remote still holds the old history and your fresh one will not line up with it. Keep this for a personal repository nobody else has touched.',
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
            'Install Git on macOS, Windows, or Linux and confirm your terminal can find it',
            'Set your name, your email, and `main` as the default branch on a new machine',
            'Create an empty GitHub repository and connect a project of your own to it',
            'Log in to GitHub from the terminal with the GitHub CLI or a personal access token',
            'Push a real project online and open a pull request against it',
            'Fix commits that show up as an unknown user',
            'Settle the divergent branches error with one setting',
            'Keep your machine-specific noise in a global `.gitignore`',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git --version                                 # check Git is installed\ngit config --global user.name "..."           # your name on every commit\ngit config --global user.email "..."          # the email GitHub matches on\ngit config --global init.defaultBranch main   # name new branches main\ngh auth login                                 # log in to GitHub from the terminal\ngit remote add origin <url>                   # point your project at GitHub\ngit push -u origin main                       # first push, and pair the branch\ngit config --global pull.rebase false         # settle the divergent branches question\ngit config --global core.excludesFile ~/.gitignore_global   # your own ignore rules',
        },
        {
          type: 'text',
          value:
            'That is the course. You started with a folder and a fear of losing work, and you finish able to branch, merge, resolve a conflict, undo almost anything, and publish. The loop of stage, commit, branch, merge, push is now yours. It does not change as the projects get bigger, and it does not care whether the folder holds chapters, drawings, spreadsheets, or code.',
        },
        {
          type: 'text',
          value:
            'Git has more in it: `git bisect` finds the commit that broke something by binary search, interactive rebase reshapes a messy branch before review, submodules nest one repository inside another. Do not go and learn them now. They will make sense the day a real problem sends you looking, and you now have the vocabulary to read the answer when you find it.',
        },
        {
          type: 'text',
          value: 'Go and make something. Commit early, push often.',
        },
      ],
    },
  ],
} satisfies Lesson
