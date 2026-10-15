const plural = new Intl.PluralRules('en')

function count(n: number, one: string, other: string): string {
  return `${n} ${plural.select(n) === 'one' ? one : other}`
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
      upNext: 'Up next: ',
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
    finishedLessonPrefix: 'You finished ',
    lessonCompletePrefix: 'Lesson complete: ',
    lessonsDone: (done: number, total: number) => `${done} of ${count(total, 'lesson', 'lessons')} done`,
    allLessons: 'All lessons',
    nextLesson: 'Next lesson',
    nextSteps: {
      title: 'What to do next',
      ownProject: 'Use Git on a project of your own.',
      lookUp: 'Look up a command when you need it.',
      openCheatsheet: 'Open the cheat sheet',
      goFurther: 'Go further with',
      gettingStartedGuide: "GitHub's getting started guide",
      andTheFree: 'and the free',
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
  },
  editor: {
    added: 'added',
    removed: 'removed',
    currentChange: '(Current Change)',
    incomingChange: '(Incoming Change)',
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
    },
    stepper: {
      previous: 'Previous step',
      next: 'Next step',
    },
  },
  sandbox: {
    windowTitle: 'terminal',
    output: 'Terminal output',
    input: 'Terminal command input. Tab completes names. Press Escape to leave the terminal.',
    settingUp: 'Setting up the practice terminal…',
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
  },
} as const
