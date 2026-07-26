import type { GitScenario, ScenarioKey, Branch } from '@/types'
import { COLORS } from './constants'

const MAIN: Branch = { name: 'main', color: COLORS.main, lane: 0 }
const FEATURE: Branch = { name: 'feature', color: COLORS.feature, lane: 1 }

const SCENARIOS = {
  branching: {

    commands: [
      'git branch feature',
      'git switch feature',
      'git commit -m "Add login"',
      'git commit -m "Add styles"',
    ],
    stages: [
      // Stage 0: initial state
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
        ],
        branches: [MAIN],
        head: 'main',
      },
      // Stage 1: git branch feature
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
        ],
        branches: [MAIN, { ...FEATURE, startsAt: 'c2' }],
        head: 'main',
      },
      // Stage 2: git switch feature (HEAD moves)
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
        ],
        branches: [MAIN, { ...FEATURE, startsAt: 'c2' }],
        head: 'feature',
      },
      // Stage 3: git commit on feature
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
      // Stage 4: another commit on feature
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
          { id: 'f2', message: 'Add styles', branch: 'feature', parents: ['f1'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
    ],
  },

  merging: {

    commands: [
      'git switch main',
      'git merge feature',
      'git branch -d feature',
    ],
    stages: [
      // Stage 0: diverged state
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'c3', message: 'Fix bug', branch: 'main', parents: ['c2'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
          { id: 'f2', message: 'Add styles', branch: 'feature', parents: ['f1'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
      // Stage 1: git switch main
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'c3', message: 'Fix bug', branch: 'main', parents: ['c2'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
          { id: 'f2', message: 'Add styles', branch: 'feature', parents: ['f1'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'main',
      },
      // Stage 2: git merge feature
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'c3', message: 'Fix bug', branch: 'main', parents: ['c2'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
          { id: 'f2', message: 'Add styles', branch: 'feature', parents: ['f1'] },
          { id: 'm1', message: 'Merge feature', branch: 'main', parents: ['c3', 'f2'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'main',
      },
      // Stage 3: git branch -d feature
      {
        commits: [
          { id: 'c1', message: 'Initial commit', branch: 'main', parents: [] },
          { id: 'c2', message: 'Add README', branch: 'main', parents: ['c1'] },
          { id: 'c3', message: 'Fix bug', branch: 'main', parents: ['c2'] },
          { id: 'f1', message: 'Add login', branch: 'feature', parents: ['c2'] },
          { id: 'f2', message: 'Add styles', branch: 'feature', parents: ['f1'] },
          { id: 'm1', message: 'Merge feature', branch: 'main', parents: ['c3', 'f2'] },
        ],
        branches: [MAIN],
        head: 'main',
      },
    ],
  },

  rebase: {

    commands: [
      'git rebase main',
      '(replaying commits)',
      'git merge feature',
    ],
    stages: [
      // Stage 0: diverged state
      {
        commits: [
          { id: 'a', message: 'A', branch: 'main', parents: [] },
          { id: 'b', message: 'B', branch: 'main', parents: ['a'] },
          { id: 'c', message: 'C', branch: 'main', parents: ['b'] },
          { id: 'd', message: 'D', branch: 'feature', parents: ['b'] },
          { id: 'e', message: 'E', branch: 'feature', parents: ['d'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
      // Stage 1: git rebase main (starting)
      {
        commits: [
          { id: 'a', message: 'A', branch: 'main', parents: [] },
          { id: 'b', message: 'B', branch: 'main', parents: ['a'] },
          { id: 'c', message: 'C', branch: 'main', parents: ['b'] },
          { id: 'd', message: 'D', branch: 'feature', parents: ['b'] },
          { id: 'e', message: 'E', branch: 'feature', parents: ['d'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
      // Stage 2: commits replayed onto main
      {
        commits: [
          { id: 'a', message: 'A', branch: 'main', parents: [] },
          { id: 'b', message: 'B', branch: 'main', parents: ['a'] },
          { id: 'c', message: 'C', branch: 'main', parents: ['b'] },
          { id: 'dp', message: "D'", branch: 'feature', parents: ['c'] },
          { id: 'ep', message: "E'", branch: 'feature', parents: ['dp'] },
        ],
        branches: [MAIN, FEATURE],
        head: 'feature',
      },
      // Stage 3: fast-forward merge — all on main
      {
        commits: [
          { id: 'a', message: 'A', branch: 'main', parents: [] },
          { id: 'b', message: 'B', branch: 'main', parents: ['a'] },
          { id: 'c', message: 'C', branch: 'main', parents: ['b'] },
          { id: 'dp', message: "D'", branch: 'main', parents: ['c'] },
          { id: 'ep', message: "E'", branch: 'main', parents: ['dp'] },
        ],
        branches: [MAIN],
        head: 'main',
      },
    ],
  },
} satisfies Record<ScenarioKey, GitScenario>

export { SCENARIOS }
