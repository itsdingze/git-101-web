import type { Lesson } from '@/types'
export default {
  id: 11,
  title: 'Team Workflow',
  description: 'Feature branches, pull requests, and the rules a shared branch needs',
  unlocks: [],
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
            'On a team, the **feature branch workflow** is how almost everyone works. It grew up in software teams, and that is where you will meet it most. The same shape suits anyone who edits files alongside other people, from co-authors on a book to a research group sharing an analysis. The `main` branch always stays working, and every new feature or fix gets its own branch. Nothing reaches `main` until another person has looked at it.',
        },
        {
          type: 'text',
          value: 'One trip through the loop looks like this:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Switch to `main` and pull, so you start from the latest work the team has merged.',
            'Create a branch with a name that says what you are doing, like `feature/add-auth`.',
            'Make your changes and commit them on that branch.',
            'Push the branch to the remote, so it sits somewhere your teammates can reach it.',
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
      type: 'sandbox-exercise',
      id: 'feature-branch-workflow-practice',
      title: 'Practice: the team workflow, start to finish',
      mode: 'goal',
      brief:
        'Below is a shared team project with a remote called `origin`. Your team lead has asked you to add a login page, and you have written it: `login.html` and `auth.js` are sitting in the folder with nothing about them saved to Git yet. Your copy of the project is two weeks behind what your teammates have pushed. **Your goal: walk the whole loop, from getting up to date to pushing a branch a teammate could review.** Call the branch `feature/add-auth`.',
      seed: {
        dir: 'project',
        remote: {
          name: 'origin',
          url: 'https://github.com/team/project.git',
          setup: [
            {
              write: {
                'README.md': '# Team project\n\nA small site.\n',
                'index.html': '<h1>Team project</h1>\n',
              },
            },
            { run: 'git add .' },
            { run: 'git commit -m "Initial commit"' },
          ],
          ahead: [
            {
              write: {
                'README.md':
                  '# Team project\n\nA small site.\n\nRun the dev server with `npm run dev`.\n',
              },
            },
            { run: 'git add .' },
            { run: 'git commit -m "Document how to run the dev server"' },
          ],
        },
        setup: [
          {
            write: {
              'login.html': '<form id="login">\n  <input name="email" />\n</form>\n',
              'auth.js': 'export function signIn(email) {\n  return fetch("/api/login")\n}\n',
            },
          },
        ],
      },
      goals: [
        {
          id: 'up-to-date',
          label: 'Your `main` has the commit your teammates pushed while you were away',
          check: {
            kind: 'commit-exists',
            messageIncludes: 'dev server',
            onBranch: 'main',
          },
          hints: [
            'The loop starts on `main`, because that is the branch your new work should grow out of',
            'Downloading the new commits and folding them into your branch is one single command',
            'It is `git pull origin main`. Run `git log --oneline` afterwards to see what arrived.',
          ],
        },
        {
          id: 'on-feature-branch',
          label: 'You are standing on a new branch called `feature/add-auth`',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'branch-exists', name: 'feature/add-auth' },
              { kind: 'on-branch', name: 'feature/add-auth' },
            ],
          },
          hints: [
            'The same command that moves you between branches can create one first',
            'It is `git switch -c feature/add-auth`',
          ],
        },
        {
          id: 'committed',
          label: 'The login page is committed on that branch',
          check: {
            kind: 'commit-exists',
            containing: ['login.html', 'auth.js'],
            onBranch: 'feature/add-auth',
          },
          hints: [
            'Two commands: stage everything you changed, then save the snapshot',
            'Nothing is staged yet, so start with `git add .`',
            'Then `git commit -m "feat: add login page"`, a message a reviewer can actually read',
          ],
        },
        {
          id: 'pushed',
          label: 'The branch is on the remote, where a teammate can review it',
          check: {
            kind: 'all-of',
            checks: [
              { kind: 'pushed', branch: 'feature/add-auth' },
              { kind: 'upstream-set', branch: 'feature/add-auth' },
            ],
          },
          hints: [
            'A teammate cannot review what they cannot see. Sending your commits up is one command.',
            'It takes the flag that pairs your branch with one of the same name on the remote, then the remote name, then the branch name',
            'It is `git push -u origin feature/add-auth`',
          ],
        },
      ],
      completionMessage:
        'That is the entire loop: get up to date, branch, stage, commit, push. The only step left is opening the pull request, and that one happens on GitHub itself. You have now practised every command a normal working day on a team asks for.',
    },
    {
      type: 'block-exercise',
      id: 'build-push-feature',
      prompt:
        'The remote has never seen your `feature/add-auth` branch. Build the command that sends it up for the first time and pairs it with a branch of the same name on `origin`:',
      availableBlocks: ['git', 'push', 'pull', '-u', 'origin', 'feature/add-auth', 'main', 'merge'],
      correctAnswer: ['git', 'push', '-u', 'origin', 'feature/add-auth'],
      hints: [
        'Sending commits up is `git push`, and the pairing flag comes straight after it',
        'The flag is `-u`, then the remote name, then the branch name',
        'Push the feature branch, not `main`. Your work goes to `main` through a pull request.',
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
            '**Discussion** happens next to the change itself, so months later you can find out why it was made.',
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
            "Resolving two small conflicts today is far easier than resolving twenty at once next week. Updating right before you open the PR also means your reviewer sees your work against the current project, not last week's.",
        },
      ],
    },
    {
      type: 'reading',
      id: 'rewriting-shared-history',
      title: 'Once a branch is pushed, other people can see it',
      content: [
        {
          type: 'text',
          value:
            'Your branch is up on the remote and a reviewer has it open. Now you spot a typo in a commit message, or a file you meant to include. Reaching for `git commit --amend` is the natural move, and this is the moment to be careful.',
        },
        {
          type: 'text',
          value:
            '`git commit --amend` and `git reset` both **rewrite history**. The commits that come out have different hashes from the ones that went in, so Git treats them as brand new commits that happen to look similar. Whether that is harmless or a disaster comes down to one question: has anyone else got the originals?',
        },
        {
          type: 'list',
          items: [
            '**Never pushed anywhere: rewrite freely.** Nobody else has a copy, so amend, reset, and reorder as much as you like.',
            '**Pushed and shared: leave them alone.** Everyone who pulled has the old versions. Replacing them means their history and yours stop lining up, and sorting that out costs somebody else an afternoon.',
          ],
        },
        {
          type: 'text',
          value:
            'When you are not sure which case you are in, use `git revert`. It adds a commit that undoes an earlier one rather than replacing anything, so it is never the wrong answer on a branch other people pull from.',
        },
        {
          type: 'text',
          value:
            'There is a middle case, and it comes up constantly. You pushed a feature branch that only you work on, then amended a commit on it. Your next push is rejected, because the branch on the remote no longer matches yours. The fix is not `--force`:',
        },
        {
          type: 'code',
          language: 'bash',
          value:
            '# Refuses if anyone pushed to the branch since you last fetched:\ngit push --force-with-lease\n\n# Overwrites whatever is there, no questions asked:\ngit push --force',
        },
        {
          type: 'text',
          value:
            '`--force-with-lease` only overwrites the branch on the remote if it still looks the way it did the last time you fetched it. If a teammate pushed something you have not seen, your push is rejected instead of quietly deleting their commits. It costs you nothing and it has saved a lot of people.',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'Never force-push a shared branch',
          value:
            'Neither `--force` nor `--force-with-lease` belongs on `main`, or on any branch your team works from. Force-pushing there rewrites history under everyone at once, and the next pull each of them runs turns into a mess you will spend the day untangling. Keep force-pushing to branches only you touch.',
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
            'Branching from a two-week-old `main` means you build on a stale copy and find out at the very end, with a pile of conflicts. Pull first, branch second.',
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
            '**Never commit secrets.** Passwords, API keys, and access tokens belong in `.gitignore`, never in a commit. Once a secret is pushed, treat it as leaked.',
            '**Read what you are about to commit.** `git diff --staged` shows exactly what is going in, and it catches the half-finished paragraph or the stray debug line every time.',
            '**On a team, work on a branch.** That way `main` stays working, and every change gets a second pair of eyes before it lands there.',
            '**Rewrite only your own branches.** Amending, resetting, and force-pushing are fine on work nobody else has pulled, and a bad day for everyone on a branch they have.',
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
            'A commit on `main` can be undone like any other, with `git revert`. The real cost is that until you do, everyone else is pulling the broken version.',
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
            'Part 1 is done, and that was the important half. The loop is the part that repeats: pull, branch, commit, push, open a pull request, merge. You will go round it several times a week for as long as you work with other people, and you have now practised all of it.',
        },
        {
          type: 'text',
          value:
            'Everything from here is **reference material**. Read it once so the words are not strange when a teammate uses them, and come back to the page when you actually need one.',
        },
        {
          type: 'list',
          items: [
            'Forks let you contribute to a project you are not a member of',
            'Rebase reshapes history into a straight line',
            "CI/CD is the robot that runs a software project's tests on every pull request",
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
            "A **fork** is your own copy of someone else's repository, sitting under your account on GitHub. You need one whenever you want to contribute to a project you have no permission to push to, which is most open-source projects.",
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
            'One word of warning about that name. `upstream` here is nothing more than the conventional nickname people give the second remote. It has no connection to the `--set-upstream` flag on `git push`. The two happen to share a word, and that is all.',
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
        'Rebase rewrites history: the replayed commits are new objects with new IDs, even though the files inside them are identical. Anything already shared has to be added to, not rewritten, or everyone else ends up holding commits that no longer exist on the remote.',
    },
    {
      type: 'reading',
      id: 'ci-cd-intro',
      title: 'CI/CD: the tests run themselves',
      content: [
        {
          type: 'text',
          value:
            "This one applies only if your project is code. **CI/CD** stands for Continuous Integration / Continuous Deployment. In practice it means a service such as [GitHub Actions](https://github.com/features/actions) runs the project's tests automatically every time someone pushes or opens a pull request, so a broken change is caught before anyone merges it.",
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
        {
          type: 'list',
          items: [
            'Run the feature branch workflow end to end: switch to `main`, pull, branch, commit, push',
            'Say what a pull request is, and what separates one a teammate can review from one nobody reads',
            'Keep a branch current by pulling `main` into it while you work, instead of at the last minute',
            'Tell when rewriting history is harmless and when it becomes everybody else\'s problem',
            'Reach for `--force-with-lease` over `--force`, and for neither of them on a branch the team shares',
            'Contribute to a project you do not own by forking it and adding an `upstream` remote',
            'Describe what a rebase does to history, and why rebasing commits other people already have is unsafe',
            "Recognise CI as the service that runs a code project's tests on every pull request",
          ],
        },
        { type: 'text', value: '**Commands from this lesson**' },
        {
          type: 'code',
          language: 'bash',
          value:
            'git switch -c feature/x            # start a feature branch\ngit push -u origin feature/x       # publish it and set up tracking\ngit pull origin main               # bring the latest main into your branch\ngit push --force-with-lease        # republish a branch of your own that you rewrote\ngit rebase main                    # replay your commits on top of main\ngit remote add upstream <url>      # track the project you forked from',
        },
        {
          type: 'text',
          value:
            'Next up: your own machine. You install Git, make a GitHub account, and take a folder of your own real work to a live repository with a pull request open on it.',
        },
      ],
    },
  ],
} satisfies Lesson
