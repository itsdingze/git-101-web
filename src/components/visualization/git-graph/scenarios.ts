import type { GitScenario, ScenarioKey, Branch, Commit } from '@/types'
import { COLORS } from './constants'

const MAIN: Branch = { name: 'main', color: COLORS.main, lane: 0 }
const DUE_DATES: Branch = { name: 'add-due-dates', color: COLORS.feature, lane: 1 }

const APP_START: Commit[] = [
  { id: 'c1', message: 'feat: add task list', branch: 'main', parents: [] },
  { id: 'c2', message: 'feat: add settings', branch: 'main', parents: ['c1'] },
]

const DUE_DATES_WORK: Commit[] = [
  { id: 'f1', message: 'feat: add due dates', branch: 'add-due-dates', parents: ['c2'] },
  { id: 'f2', message: 'feat: show due dates in the list', branch: 'add-due-dates', parents: ['f1'] },
]

const README_FIX: Commit = { id: 'c3', message: 'docs: fix typo in README', branch: 'main', parents: ['c2'] }

const DUE_DATES_MERGE: Commit = { id: 'm1', message: "Merge branch 'add-due-dates'", branch: 'main', parents: ['c3', 'f2'] }

const SCENARIOS = {
  branching: {
    commands: [
      'git switch -c add-due-dates',
      'git commit -m "feat: add due dates"',
      'git commit -m "feat: show due dates in the list"',
    ],
    stages: [
      { commits: APP_START, branches: [MAIN], head: 'main' },
      { commits: APP_START, branches: [MAIN, { ...DUE_DATES, startsAt: 'c2' }], head: 'add-due-dates' },
      { commits: [...APP_START, DUE_DATES_WORK[0]!], branches: [MAIN, DUE_DATES], head: 'add-due-dates' },
      { commits: [...APP_START, ...DUE_DATES_WORK], branches: [MAIN, DUE_DATES], head: 'add-due-dates' },
    ],
  },

  merging: {
    commands: ['git switch main', 'git merge add-due-dates', 'git branch -d add-due-dates'],
    stages: [
      { commits: [...APP_START, README_FIX, ...DUE_DATES_WORK], branches: [MAIN, DUE_DATES], head: 'add-due-dates' },
      { commits: [...APP_START, README_FIX, ...DUE_DATES_WORK], branches: [MAIN, DUE_DATES], head: 'main' },
      {
        commits: [...APP_START, README_FIX, ...DUE_DATES_WORK, DUE_DATES_MERGE],
        branches: [MAIN, DUE_DATES],
        head: 'main',
      },
      { commits: [...APP_START, README_FIX, ...DUE_DATES_WORK, DUE_DATES_MERGE], branches: [MAIN], head: 'main' },
    ],
  },
} satisfies Record<ScenarioKey, GitScenario>

export { SCENARIOS }
