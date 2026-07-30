import type { Lesson } from '@/types'
export default {
  id: 11,
  title: 'Real-World Workflow',
  description: 'Put it all together with a professional Git workflow',
  steps: [
    {
      type: 'reading',
      id: 'feature-branch-workflow',
      title: 'Part 1: the feature branch workflow',
      content: [
        {
          type: 'text',
          value:
            'This lesson comes in two parts. **Part 1** is the workflow you will actually use on a team, most days, and it is worth learning properly. **Part 2** is a short tour of things you will meet eventually, with nothing to memorise.',
        },
        {
          type: 'text',
          value:
            'On a team, the **feature branch workflow** is how almost everyone works. The `main` branch always stays working, and every new feature or fix gets its own branch. Nothing reaches `main` until another person has looked at it.',
        },
        {
          type: 'text',
          value: 'One trip through the loop looks like this:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Switch to `main` and pull, so you start from the latest team code.',
            'Create a branch with a name that says what you are doing, like `feature/add-auth`.',
            'Make your changes and commit them on that branch.',
            'Push the branch to the **remote**, the copy of the project that lives on GitHub.',
            'Open a **pull request**, which asks the team to merge your branch into `main`.',
            'Once a teammate approves it, merge into `main` and delete the branch.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch main\ngit pull origin main\ngit switch -c feature/add-auth\n# ... make changes and commit ...\ngit push -u origin feature/add-auth',
        },
        {
          type: 'text',
          value:
            'That is the whole loop. You already know every command in it. The only new ideas are the order, and the rule that `main` is not yours to commit to directly.',
        },
      ],
    },
    {
      type: 'workflow-exercise',
      id: 'feature-branch-workflow-practice',
      title: 'Practice: the team workflow, start to finish',
      scenario:
        'You are in your team\'s shared project, cloned onto your machine, not the `my-project` you built earlier in the course. Your team lead has asked you to add a login page, and your copy of the project is two weeks behind. Walk the whole loop, from getting up to date to pushing a branch that is ready for a pull request.',
      steps: [
        {
          narration:
            'The loop starts on `main`, because that is the branch your new work should grow out of. Move onto it before anything else.',
          expectedCommand: 'git switch main',
          acceptableVariants: ['git checkout main'],
          successOutput: "Switched to branch 'main'",
          hints: [
            'You want the command that moves you onto a branch that already exists',
            'It is `git switch` followed by the name of the branch you want to stand on',
            'It is `git switch main`',
          ],
        },
        {
          narration:
            'Your copy of `main` is two weeks old. Bring down everything your teammates have pushed since then, so your branch starts from current code instead of stale code.',
          expectedCommand: 'git pull origin main',
          acceptableVariants: ['git pull'],
          successOutput:
            'From https://github.com/team/project\nUpdating 8c2f4a1..9c4f7d2\nFast-forward\n README.md | 4 ++--\n 1 file changed, 2 insertions(+), 2 deletions(-)',
          hints: [
            'Downloading the new commits and folding them into your branch is one single command',
            'It is `git pull`, then the remote name, then the branch name',
            'It is `git pull origin main`',
          ],
        },
        {
          narration:
            'You are level with the team now. Make the branch for this piece of work and move onto it in one step. Name it `feature/add-auth`.',
          expectedCommand: 'git switch -c feature/add-auth',
          acceptableVariants: ['git checkout -b feature/add-auth'],
          successOutput: "Switched to a new branch 'feature/add-auth'",
          hints: [
            'The same command that moves you between branches can create one first',
            'Add the flag that means create to `git switch`, then the branch name',
            'It is `git switch -c feature/add-auth`',
          ],
        },
        {
          narration:
            'You have written the login page. Nothing goes into a commit on its own, so mark everything you changed as ready to be saved.',
          expectedCommand: 'git add .',
          acceptableVariants: ['git add -A', 'git add --all'],
          successOutput: '',
          hints: [
            'This is the staging step, between editing a file and saving it',
            'The command takes a `.` to mean everything in this folder',
            'It is `git add .`',
          ],
        },
        {
          narration:
            'Staging only marks what goes in. Now save that work permanently on this branch, with a message a reviewer can actually read.',
          expectedCommand: 'git commit -m "feat: add login page"',
          acceptPrefix: 'git commit -m',
          successOutput:
            '[feature/add-auth 5d9e3b7] feat: add login page\n 2 files changed, 42 insertions(+)\n create mode 100644 auth.js\n create mode 100644 login.html',
          hints: [
            'This is the step that turns staged changes into a permanent snapshot',
            'The command carries your message inline, behind the `-m` flag',
            'Try `git commit -m "feat: add login page"`',
          ],
        },
        {
          narration:
            'The branch exists only on your machine so far, and a teammate cannot review what they cannot see. Send it up to the remote, and pair it with the branch of the same name up there so every later push needs no extra typing.',
          expectedCommand: 'git push -u origin feature/add-auth',
          acceptableVariants: ['git push --set-upstream origin feature/add-auth'],
          successOutput:
            "branch 'feature/add-auth' set up to track 'origin/feature/add-auth'.\nTo https://github.com/team/project.git\n * [new branch]      feature/add-auth -> feature/add-auth",
          hints: [
            'Sending your commits up to the remote is one command',
            'It needs the tracking flag from lesson 4, then the remote name, then the branch name',
            'It is `git push -u origin feature/add-auth`',
          ],
        },
      ],
      completionMessage:
        'That is the entire loop: get up to date, branch, stage, commit, push. The only step left is opening the pull request, and that one happens in your browser. You have now practised every command a normal working day on a team asks for.',
    },
    {
      type: 'block-exercise',
      id: 'build-switch-feature',
      prompt: 'Build the command to create and switch to a new feature branch called "feature/add-auth":',
      availableBlocks: ['git', 'switch', '-c', 'branch', 'feature/add-auth', 'checkout', '-b', 'main'],
      correctAnswer: ['git', 'switch', '-c', 'feature/add-auth'],
      acceptableAnswers: [['git', 'checkout', '-b', 'feature/add-auth']],
      hints: [
        'Use git switch with the -c flag to create and switch in one step',
        'The branch name follows the -c flag',
      ],
    },
    {
      type: 'reading',
      id: 'pr-workflow',
      title: 'Pull requests and code review',
      content: [
        {
          type: 'text',
          value:
            'A **pull request** (usually shortened to **PR**) is a request to merge your branch into another branch, normally `main`. You create it on GitHub, GitLab, or Bitbucket by clicking a button. It is not a Git command, and there is nothing to install.',
        },
        {
          type: 'text',
          value: 'A pull request does three jobs at once:',
        },
        {
          type: 'list',
          items: [
            '**Review** puts your changes in front of teammates line by line, so they can ask questions and suggest fixes before anything reaches `main`.',
            '**Discussion** happens next to the code, so months later you can find out why a change was made.',
            '**Record-keeping** ties the branch, its commits, and the discussion together in one place you can go back to.',
          ],
        },
        {
          type: 'text',
          value:
            'A good pull request has a title that says what it does, a short description of what changed and why, and a small enough set of changes that a person can actually read it. A 40-line PR gets useful review. A 4,000-line PR gets a thumbs up from someone who did not really read it.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'staying-up-to-date',
      title: 'Keeping your branch up to date',
      content: [
        {
          type: 'text',
          value:
            'While you work on your branch, other people keep merging their own work into `main`. The longer your branch sits apart from `main`, the further the two drift, and the messier the eventual merge gets. So pull the new `main` into your branch as you go.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# On your feature branch, bring in the latest main:\ngit switch feature/add-auth\ngit pull origin main',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Do this before you open a pull request',
          value:
            'Resolving two small conflicts today is far easier than resolving twenty at once next week. Updating right before you open the PR also means your reviewer sees your work against current code, not last week\'s.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-feature-branch-start',
      question:
        'Your team lead asks you to add a login page. You already have the project cloned, and you last worked on it two weeks ago. What is the right first move?',
      options: [
        {
          text: 'Edit the files on `main` and commit there, since the change is small',
          whyWrong:
            'Small changes are exactly how a shared `main` gets broken. On a team, work goes on its own branch so someone can review it before it reaches the branch everyone else builds on.',
        },
        {
          text: 'Create the branch straight away, and pull `main` into it later once you are finished',
          whyWrong:
            'Branching from a two-week-old `main` means you build on stale code and find out at the very end, with a pile of conflicts. Pull first, branch second.',
        },
        {
          text: 'Switch to `main`, pull the latest changes, then create a branch like `feature/login-page`',
        },
        {
          text: 'Clone the repository a second time so the login work sits in its own folder',
          whyWrong:
            'A second clone gives you a second copy of everything to keep in sync by hand. A branch does the same separation inside the folder you already have.',
        },
      ],
      correctIndex: 2,
      explanation:
        'Pulling first means your branch starts from the same code your teammates are working on right now, so any conflicts you hit are small and immediate instead of huge and last-minute. The branch then keeps your half-finished login page away from `main` until it is reviewed.',
    },
    {
      type: 'reading',
      id: 'best-practices',
      title: 'Habits worth keeping',
      content: [
        {
          type: 'text',
          value: 'These are the habits that separate a calm Git user from a stressed one:',
        },
        {
          type: 'list',
          items: [
            '**Commit often.** Small, focused commits are easier to review, and easier to undo when one of them turns out to be the problem.',
            '**Pull before you push.** Running `git pull` first means you build on what your teammates just pushed, instead of colliding with it.',
            '**Never commit secrets.** API keys, passwords, and tokens belong in `.gitignore`, never in a commit. Once a secret is pushed, treat it as leaked.',
            '**Read what you are about to commit.** `git diff --staged` shows exactly what is going in, and it catches the stray debug line every time.',
            '**On a team, work on a branch.** That way `main` stays working, and every change gets a second pair of eyes before it lands there.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Your own projects are different',
          value:
            'On a solo project, committing straight to `main` is completely fine. It is what you have been doing all course, and nothing was wrong with it. The branch rule exists because on a team, `main` is a branch other people depend on while you work.',
        },
      ],
    },
    {
      type: 'quiz',
      id: 'quiz-best-practices',
      question: 'Why does a team ask you to work on a branch instead of committing straight to `main`?',
      options: [
        {
          text: 'Because Git refuses to accept commits made directly on `main`',
          whyWrong:
            'Git will happily commit to `main`, because it has no idea what your team agreed. The rule is a human agreement, sometimes enforced by a GitHub setting, never by Git itself.',
        },
        {
          text: 'Because a commit made on `main` cannot be undone afterwards',
          whyWrong:
            'A commit on `main` can be undone like any other, with `git revert`. The real cost is that until you do, everyone else is pulling your broken code.',
        },
        {
          text: 'Because a branch keeps your full history, while `main` only stores the latest version',
          whyWrong:
            '`main` keeps every commit ever made on it, same as any branch. Branches separate work in progress from finished work. They do not add history that `main` lacks.',
        },
        {
          text: 'So a teammate can review the changes in a pull request before they reach the branch everyone builds on',
        },
      ],
      correctIndex: 3,
      explanation:
        'The point of the branch is the review gate it creates. Your half-done work stays off `main` until another person has read it, so the branch everyone pulls from stays in a working state.',
    },
    {
      type: 'reading',
      id: 'good-to-know-intro',
      title: 'Part 2: good to know',
      content: [
        {
          type: 'text',
          value:
            'Part 1 is done, and that was the important half. A working developer repeats that loop every single day: pull, branch, commit, push, open a pull request, merge. You have now practised all of it.',
        },
        {
          type: 'text',
          value:
            'Everything from here is **reference material**. You do not need to memorise any of it today. Read it once so the words are not strange when a teammate uses them, and come back to the page when you actually need one.',
        },
        {
          type: 'list',
          items: [
            'Forks let you contribute to a project you are not a member of',
            'Rebase reshapes history into a straight line',
            'Tags are permanent bookmarks for releases like `v1.0`',
            '`git blame` tells you who last touched a line, and in which commit',
            'CI/CD is the robot that runs the tests on your pull request',
          ],
        },
      ],
    },
    {
      type: 'reading',
      id: 'fork-workflow',
      title: 'Forks: contributing to a project you do not own',
      content: [
        {
          type: 'text',
          value:
            'A **fork** is your own copy of someone else\'s repository, sitting under your account on GitHub. You need one whenever you want to contribute to a project you have no permission to push to, which is most open-source projects.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Fork the project on GitHub, then clone **your fork** to your machine.',
            'Add the original project as a second remote, named `upstream`, so you can pull its updates.',
            'Branch, commit, and push to your fork exactly as in Part 1.',
            'Open a pull request from your fork to the original project.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git clone https://github.com/your-username/project.git\ncd project\n\n# Point at the original project so you can pull its updates:\ngit remote add upstream https://github.com/original-owner/project.git\ngit fetch upstream\ngit merge upstream/main',
        },
        {
          type: 'text',
          value:
            'One word of warning: `upstream` here is nothing more than a conventional name people give that second remote. It has no connection to the `--set-upstream` flag you met in lesson 4. The two happen to share a word — that is all.',
        },
        {
          type: 'text',
          value:
            'The one difference from Part 1: you push to your fork, never to the original. The pull request is what bridges the two.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'rebase-intro',
      title: 'Rebase: a straight-line history',
      content: [
        {
          type: 'text',
          value:
            '**Rebase** is another way to bring `main` into your branch. A merge joins two lines of history with a new merge commit. A rebase instead lifts your commits off, moves your branch to the tip of `main`, and replays your commits on top. The history comes out as one straight line with no fork in it.',
        },
        {
          type: 'text',
          value:
            'Why a team would want that: a straight line is much easier to read in `git log`, and it makes bug hunting easier. With linear history you can step backwards one commit at a time until you find the exact commit that broke things, and Git can even automate that search for you with `git bisect`.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# On your feature branch:\ngit rebase main\n\n# Your commits are replayed on top of the latest commit on main.',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'Never rebase commits other people already have',
          value:
            'A rebase does not move your commits. It replaces them with brand new ones that have different IDs. If the originals were already pushed to a branch a teammate has pulled, their copy and yours no longer agree, and sorting that out costs the whole team an afternoon. Rebase only commits that have never left your machine.',
        },
      ],
      visualization: 'git-graph',
      visualizationVariant: 'rebase',
    },
    {
      type: 'quiz',
      id: 'quiz-rebase-safety',
      question:
        'You pushed your `feature/checkout` branch yesterday, and a teammate has already pulled it to help you finish. Today you want a tidier history. What should you avoid doing?',
      options: [
        {
          text: 'Rebasing that branch, because it replaces the commits your teammate already pulled with new ones',
        },
        {
          text: 'Adding any more commits until your teammate is done, because two people on one branch will clash',
          whyWrong:
            'Adding new commits on top is normal, safe branch work, and that is what a shared branch is for. The danger is rewriting commits that are already there.',
        },
        {
          text: 'Merging `main` into the branch, because merging a shared branch is unsafe',
          whyWrong:
            'Merging `main` in is the safe option here. It adds one new commit and leaves every existing commit untouched, so your teammate keeps everything they already pulled.',
        },
        {
          text: 'Pushing again, because a second push to the same branch overwrites the first',
          whyWrong:
            'A normal push adds your new commits to what is already on the remote. It only overwrites when you force it, and forcing is exactly what a rebase of a pushed branch would make you do.',
        },
      ],
      correctIndex: 0,
      explanation:
        'Rebase rewrites history: the replayed commits are new objects with new IDs, even though the code is the same. Anything already shared has to be added to, not rewritten, or everyone else ends up holding commits that no longer exist on the remote.',
    },
    {
      type: 'reading',
      id: 'tags-intro',
      title: 'Tags: marking releases',
      content: [
        {
          type: 'text',
          value:
            'A **tag** is a permanent bookmark on one specific commit, most often used to mark a released version like `v1.0` or `v2.3.1`. A branch moves forward as you commit. A tag never moves, so `v1.0` points at exactly the code you shipped as 1.0, forever.',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            'git tag -a v1.0 -m "Release 1.0"    # Mark the current commit\ngit tag                             # List every tag\ngit push origin --tags              # Tags are not pushed by default',
        },
      ],
    },
    {
      type: 'reading',
      id: 'useful-commands',
      title: 'git blame: who wrote this line',
      content: [
        {
          type: 'text',
          value:
            '`git blame` shows, for every line of a file, the commit that last changed it and who made that commit. The name sounds accusing, but the real use is finding the commit message that explains a line you do not understand, and knowing who to ask about it.',
        },
        {
          type: 'code',
          language: 'bash',
          value: 'git blame src/app.js',
        },
      ],
    },
    {
      type: 'reading',
      id: 'ci-cd-intro',
      title: 'CI/CD: the tests run themselves',
      content: [
        {
          type: 'text',
          value:
            '**CI/CD** stands for Continuous Integration / Continuous Deployment. In practice it means a service such as [GitHub Actions](https://github.com/features/actions) runs your project\'s tests automatically every time someone pushes or opens a pull request, so a broken change is caught before anyone merges it.',
        },
        {
          type: 'text',
          value:
            'Setting one up is beyond this course, but you will meet them everywhere. When you see a green tick or a red cross next to a pull request, that is CI reporting whether the tests passed.',
        },
      ],
    },
    {
      type: 'reading',
      id: 'recap',
      title: 'Recap',
      content: [
        { type: 'text', value: 'You can now:' },
        { type: 'text', value: '**From this lesson**' },
        {
          type: 'list',
          items: [
            'Run the feature branch workflow end to end: switch to `main`, pull, branch, commit, push',
            'Say what a pull request is, and what separates one a teammate can review from one nobody reads',
            'Keep a branch current by pulling `main` into it while you work, instead of at the last minute',
            'Contribute to a project you do not own by forking it and adding an `upstream` remote',
            'Describe what a rebase does to history, and why rebasing commits other people already have is unsafe',
            'Mark a release with a tag, and find out who last changed a line with `git blame`',
            'Recognise CI as the service that runs your project\'s tests on every pull request',
          ],
        },
        { type: 'text', value: '**Across the whole course**' },
        {
          type: 'list',
          items: [
            'Set up Git and turn any folder into a repository',
            'Stage and commit changes, and write a message your future self can use',
            'Read a project\'s history with `git log` and `git diff`',
            'Undo safely: unstage a file, discard a change, revert a commit, and recover work you thought was gone',
            'Create branches, merge them, and resolve a merge conflict by hand',
            'Connect a project to GitHub and push and pull with confidence',
            'Run the full team workflow: pull, branch, commit, push, pull request, merge',
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch -c feature/x            # start a feature branch\ngit push -u origin feature/x       # publish it and set up tracking\ngit rebase main                    # replay your commits on top of main\ngit remote add upstream <url>      # track the project you forked from\ngit tag -a v1.0 -m "Release 1.0"   # bookmark a release\ngit blame <file>                   # who last changed each line',
        },
        {
          type: 'text',
          value:
            'That is the whole course. The best next step is a real project: put something on GitHub, break it, and fix it with what you now know. Git has corners you have not met yet, like `git bisect`, interactive rebase, and submodules. They will make sense on the day a real problem sends you looking for them. Go build something.',
        },
      ],
    },
  ],
} satisfies Lesson
