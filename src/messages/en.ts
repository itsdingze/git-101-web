const plural = new Intl.PluralRules('en')

function count(n: number, one: string, other: string): string {
  return `${n} ${plural.select(n) === 'one' ? one : other}`
}

function fileList(names: readonly string[]): string {
  const last = names[names.length - 1]
  if (last === undefined) return 'empty'
  if (names.length === 1) return last
  return `${names.slice(0, -1).join(', ')} and ${last}`
}

export const messages = {
  app: {
    name: 'Git 101',
    skipToContent: 'Skip to main content',
    lessonNotFoundTitle: 'Lesson not found — Git 101',
    pageNotFoundTitle: 'Page not found — Git 101',
  },
  error: {
    documentTitle: 'Something went wrong — Git 101',
    title: 'Something went wrong',
    body: 'Reload the page to try again. If it keeps happening, go back to all lessons.',
    reload: 'Reload the page',
    back: 'Back to all lessons',
  },
  header: {
    skipChecks: 'Skip checks',
    starOnGitHub: (stars: number | null) =>
      stars ? `Star this project on GitHub, ${count(stars, 'star', 'stars')} so far` : 'Star this project on GitHub',
    backToLessons: 'Back to all lessons',
    allLessons: 'All lessons',
    openCheatsheet: 'Open the cheat sheet',
    cheatsheet: 'Cheat sheet',
    progress: (step: number, total: number) => `Lesson progress: step ${step} of ${total}`,
    theme: 'Theme',
    themeChoice: { system: 'Match system', light: 'Light', dark: 'Dark' },
  },
  footer: {
    goBack: 'Go back',
    finishLesson: 'Finish lesson',
    continue: 'Continue',
    changeAnswer: 'Change your answer above',
    checkAnswer: 'Check answer',
  },
  cheatsheet: {
    title: 'Cheat sheet',
    close: 'Close the cheat sheet',
    intro: "A reference for the course's commands. Ticks mark commands from completed lessons.",
    learned: 'Learned',
  },
  notFound: {
    lesson: {
      title: "We couldn't find that lesson",
      body: 'The link may be out of date, or that lesson may have moved.',
    },
    page: {
      title: "We couldn't find that page",
      body: 'The link may be out of date, or that page may have moved.',
    },
    back: 'Back to all lessons',
  },
  home: {
    documentTitle: "Git 101: Let's learn Git",
    description:
      'Learn Git with short lessons, quizzes, and a practice terminal in your browser. Start with commits, then practise branches, merging, and team workflows.',
    hero: {
      title: "Let's learn Git",
      start: 'Start learning',
      continue: (lessonTitle: string) => `Continue: ${lessonTitle}`,
      allFinished: 'You finished every lesson. Revisit any of them below.',
    },
    card: {
      completed: 'Completed',
      upNext: (lessonTitle: string) => `Up next: ${lessonTitle}`,
      minutes: (minutes: number) => `About ${minutes} min`,
    },
  },
  lessonPage: {
    documentTitle: (lessonTitle: string) => `${lessonTitle} — Git 101`,
  },
  share: {
    homeImageAlt: "Git 101: Let's learn Git",
    lessonImageAlt: (lessonTitle: string) => `${lessonTitle}, a Git 101 lesson`,
    lessonEyebrow: (lessonNumber: number) => `Lesson ${lessonNumber}`,
    homeEyebrow: 'A free, hands-on course',
  },
  summary: {
    documentTitle: (lessonTitle: string) => `${lessonTitle} complete — Git 101`,
    courseFinished: 'You finished Git 101',
    lessonComplete: 'Lesson complete',
    finishedLesson: 'You finished {lesson}',
    lessonCompleteNamed: 'Lesson complete: {lesson}',
    lessonsDone: (done: number, total: number) => `${done} of ${count(total, 'lesson', 'lessons')} done`,
    allLessons: 'All lessons',
    nextLesson: 'Next lesson',
    nextSteps: {
      title: 'What to do next',
      ownProject: 'Use Git on a project of your own.',
      lookUp: 'Look up a command when you need it.',
      openCheatsheet: 'Open the cheat sheet',
      goFurther: 'Go further with {guide} and the free {book}.',
      gettingStartedGuide: "GitHub's getting started guide",
      proGitBook: 'Pro Git book',
    },
  },
  exercise: {
    startOver: 'Start over',
    showHint: 'Show hint',
    hideHint: 'Hide hint',
  },
  quiz: {
    genericWrong: 'Choose another answer, then check it again.',
  },
  blocks: {
    emptyAnswer: 'Tap the blocks below, or drag them here, to build the command',
    correct: (answer: string) => `That's the command: \`${answer}\``,
    add: (block: string) => `Add ${block} to answer`,
    remove: (block: string) => `Remove ${block} from your answer`,
    missingFirst: 'Add the piece that starts the command.',
    missingLast: 'Add the piece that finishes the command.',
    missingBetween: (before: string, after: string) => `Add the piece that goes between \`${before}\` and \`${after}\`.`,
    doesNotBelong: (piece: string) => `\`${piece}\` doesn't belong in this command.`,
    wrongOrder: 'The pieces are right. Change their order, then check the command again.',
    answerArea: 'Your answer',
  },
  editor: {
    added: 'added',
    removed: 'removed',
    currentChange: '(Current Change)',
    incomingChange: '(Incoming Change)',
    contents: (fileName: string) => `${fileName} contents`,
    cursorPosition: 'Ln 1, Col 1',
    encoding: 'UTF-8',
  },
  reading: {
    codeSample: 'Code sample',
    showDiagram: 'Show the diagram',
    path: 'Path',
    openFiles: 'Open files',
    finder: {
      back: 'Back',
      forward: 'Forward',
      filesIn: (location: string) => `Files in /${location}`,
      emptyFolder: (label: string) => `${label}, an empty folder`,
      hiddenEntry: (name: string, kind: string) => `${name} (hidden ${kind})`,
      folder: (name: string) => `${name} (folder)`,
    },
    terminalExample: {
      region: 'Terminal example',
      windowTitle: 'terminal — example',
    },
    graph: {
      region: 'Commit graph',
      initialState: 'Initial state',
      newBranch: 'New branch created',
      describe: (commits: number, branches: string, head: string) =>
        `Commit graph: ${count(commits, 'commit', 'commits')} on ${branches}. HEAD is on ${head}.`,
      branchJoiner: ' and ',
    },
    threePlaces: {
      title: "Git's three places",
      startOver: 'Start over',
      working: 'Working directory',
      staging: 'Staging area',
      repo: 'Repository history',
      untracked: 'untracked',
      staged: 'staged',
      committed: 'committed',
      ignored: 'ignored',
      explanation:
        'Your files stay in the working directory. Staging copies their current contents into the staging area. Committing records a project version using those staged contents.',
      done: 'This commit records the staged files. Your files are still in the working directory.',
      ranCommand: (command: string, staging: readonly string[], repo: readonly string[]) =>
        `Ran ${command}. Staging area: ${fileList(staging)}. Repository history: ${fileList(repo)}.`,
    },
    stepper: {
      previous: 'Previous step',
      next: 'Next step',
    },
    diagramFailed: "The diagram didn't load. Reload the page to try again.",
  },
  sandbox: {
    windowTitle: 'terminal',
    output: 'Terminal output',
    input: 'Terminal command input. Tab completes names. Press Escape to leave the terminal.',
    settingUp: 'Setting up the practice terminal…',
    setupFailed: "The practice terminal didn't load.",
    setupFailedAgain: "The practice terminal still didn't load. Reload the page to try again.",
    retrySetup: 'Try again',
    alreadyCompleted: "You've completed this exercise. Practise again, or press Continue.",
    exerciseComplete: 'Exercise complete.',
    keys: {
      tab: 'Tab',
      tabLabel: 'Tab: complete the name',
      previous: 'Previous',
      previousLabel: 'Previous command',
      next: 'Next',
      nextLabel: 'Next command',
    },
    coach: {
      goal: 'Goal',
      done: 'Done',
      tip: 'Tip',
      warning: 'Warning',
      hint: 'Hint',
      complete: 'Complete',
    },
    conflict: {
      editing: (path: string) => `Editing ${path}`,
      instructions:
        'Keep the surrounding code and resolve the conflicting section. Save, then run `git add <file>` again after every edit, even if you already staged the file.',
      cancel: 'Cancel',
      save: 'Save',
      open: 'Open',
      editLabel: (fileName: string) => `Edit ${fileName}`,
    },
    tips: {
      unmergedBranch:
        "Git couldn't confirm that this branch is merged. Merge work you need before deleting it. `-D` skips that check and can make unmerged commits hard to recover.",
      noSuchCommit: (startPoint: string) =>
        `There's no commit \`${startPoint}\` in this repository. Run \`git log --oneline\` and copy a hash from its list.`,
      branchNameWithSpaces: (hyphenated: string) =>
        `Branch names can't have spaces. Join the words with hyphens: \`git switch -c ${hyphenated}\``,
      noSuchBranch: (name: string) =>
        `There's no branch called \`${name}\` yet. To create it and move onto it, add \`-c\`: \`git switch -c ${name}\``,
      mainExists: '`main` already exists. Move onto it with `git switch main`.',
      branchExists: (name: string) =>
        `You already have a branch called \`${name}\`. Move onto it with \`git switch ${name}\`, or delete it with \`git branch -d ${name}\` and try again.`,
      emptyDiff:
        'No output means no unstaged changes to tracked files. Use `git status` to check for new files and `git diff --staged` to inspect staged changes.',
      unknownCommit: (revision: string) =>
        `\`${revision}\` isn't in your history. Run \`git log --oneline\` and use a hash from your own list.`,
      nothingStaged:
        "Nothing is staged, so there's nothing to commit. Stage your changes with `git add <file>` first, then commit.",
      untypedMessage: 'This course starts each message with its type, like `feat: add search` or `fix: stop crash`.',
      newOnGitHubMain:
        "The new work is on GitHub's `main`, not on your `main` yet. Run `git pull origin main` to bring it into this branch.",
      mergeDirectionAfterConflict: (branch: string) =>
        `You're on \`${branch}\`, so this brings \`main\` into \`${branch}\`. If you meant to bring \`${branch}\` into \`main\`, press Start over, then run \`git switch main\` and \`git merge ${branch}\`.`,
      mergeDirection: (branch: string) =>
        `You're on \`${branch}\`, so this brings \`main\` into \`${branch}\`. If you meant to bring \`${branch}\` into \`main\`, run \`git switch main\` first, then \`git merge ${branch}\`.`,
      mergeCurrentBranch: (branch: string) =>
        `You're already on \`${branch}\`, so there's nothing to bring in. Move to the branch that should receive the work first, like \`git switch main\`, then run \`git merge ${branch}\`.`,
      unresolvedConflict: 'A file still has a conflict. Fix it, stage it with `git add <file>` to mark it settled, then commit.',
      uncommittedBeforeMerge: "You have changes that aren't committed yet. Commit or stash them first, then run the command again.",
      copiedPrompt: "Leave out the `$` at the start. It's the prompt, not part of the command.",
      copiedFullPrompt: (command: string) =>
        `Leave out the prompt, everything up to and including the \`$\`. Type only the command: \`${command}\``,
      copiedNote: (command: string) => `Leave out the note after \`#\`. Copy only the command itself: \`${command}\``,
      curlyQuotes: (straightened: string) =>
        `Those are curly quotes, which the terminal doesn't treat as quotes. Type straight quotes instead: \`${straightened}\``,
      unquotedMessage: (suggestion: string) =>
        `Put the message in quotes, so Git reads it as one message: \`${suggestion}\``,
      unreadableName: (suggestion: string) =>
        `Git couldn't read that as one name, so nothing was saved. Put your full name in quotes: \`${suggestion}\``,
      firstWordOfName: (firstWord: string, suggestion: string) =>
        `Only the first word, \`${firstWord}\`, was saved as your name. Put your full name in quotes: \`${suggestion}\``,
      missingConfigScope: (suggestion: string) => `Add \`--global\` so the setting covers every project: \`${suggestion}\``,
      noPushDestination:
        "This project isn't connected to GitHub yet, so there's nowhere to send it. Connect it first with `git remote add origin <url>`, using the address of your GitHub repository, then try again.",
      unreachableOrigin:
        "Git can't reach `origin`. Run `git remote -v`: if nothing is listed, add it with `git remote add origin <url>`. If the address looks wrong, press Start over and add the right one.",
      remoteExists: '`origin` already has an address. Check it with `git remote -v`. If it looks wrong, press Start over and add the right one.',
      cloneRepositoryNotFound: "Git couldn't find a repository at that address. Check it for typos, then run `git clone` again.",
      remoteRepositoryNotFound:
        "Git couldn't find a repository at that address. Check it for typos with `git remote -v`. If it's wrong, press Start over and add the right one.",
      forcePush:
        "That replaced GitHub's copy with yours, so any commits your teammates pushed are gone from it. Pull instead of forcing. If a goal can no longer be met, press Start over.",
      cloneOwnerAndRepository: (name: string) =>
        `Git needs the full address. Run \`gh repo clone ${name}\`, or \`git clone https://github.com/${name}.git\`.`,
      cloneScheme: (address: string) => `A web address needs its start too: \`git clone https://${address}\``,
      cdWithoutSpace: 'Put a space between `cd` and `..`: `cd ..`',
      windowsDir: '`dir` is a Windows command. In this terminal, `ls` lists a folder.',
      windowsCls: '`cls` is a Windows command. In this terminal, `clear` empties the screen.',
      lowercaseCommand: (command: string) => `Commands are lowercase. Try \`${command}\`.`,
      insideFolder: (name: string, holder: string) => `\`${name}\` is inside \`${holder}\`. Run \`cd ${holder}\` first.`,
      noSuchName: "Nothing in this folder has that exact name. Run `ls` to see what's here, and type names exactly, capitals included.",
      untrackedProject: "This folder isn't a Git repository yet. If it's your project, run `git init` here to start one.",
      notARepository:
        "This folder isn't a Git repository. Run `ls`: if your project is a folder here, `cd` into it first. Run `git init` only to start a brand-new repository.",
    },
  },
} as const
