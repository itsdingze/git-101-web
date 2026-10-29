import { describe, expect, it } from 'vitest'
import type { GoalCheck } from '@/lib/git-sim/goals/goalChecks'
import { goalCheckSchema } from './goalCheckSchema'

type EveryField<Kind extends GoalCheck['kind']> = Required<Extract<GoalCheck, { kind: Kind }>>

const LEAF: GoalCheck = { kind: 'repo-initialized' }

const ONE_OF_EACH_KIND: { [Kind in GoalCheck['kind']]: EveryField<Kind> } = {
  'repo-initialized': { kind: 'repo-initialized' },
  'repo-above-project': { kind: 'repo-above-project' },
  'no-conflict-markers': { kind: 'no-conflict-markers' },
  'markers-committed': { kind: 'markers-committed' },
  'markers-staged': { kind: 'markers-staged' },
  'files-staged': { kind: 'files-staged', paths: ['a.txt'] },
  'commit-exists': {
    kind: 'commit-exists',
    containing: ['a.txt'],
    modifies: ['b.txt'],
    onBranch: 'main',
    messageIncludes: 'Add',
  },
  'merge-commit-exists': { kind: 'merge-commit-exists', onBranch: 'main' },
  'merge-in-progress': { kind: 'merge-in-progress' },
  'branch-exists': { kind: 'branch-exists', name: 'feature' },
  'branch-absent': { kind: 'branch-absent', name: 'feature' },
  'on-branch': { kind: 'on-branch', name: 'main' },
  'file-present': { kind: 'file-present', path: 'a.txt' },
  'file-absent': { kind: 'file-absent', path: 'a.txt' },
  'file-has-line': { kind: 'file-has-line', path: 'a.txt', line: 'hello' },
  'file-matches': { kind: 'file-matches', path: 'a.txt', lines: ['hello'] },
  'nested-repository': { kind: 'nested-repository' },
  'working-tree-clean': { kind: 'working-tree-clean' },
  'up-to-date-with-remote': { kind: 'up-to-date-with-remote', branch: 'main' },
  pushed: { kind: 'pushed', branch: 'main' },
  'upstream-set': { kind: 'upstream-set', branch: 'main' },
  'clone-exists': { kind: 'clone-exists', path: 'todo-app' },
  'stash-count': { kind: 'stash-count', count: 1 },
  'stash-empty': { kind: 'stash-empty' },
  'head-message': { kind: 'head-message', includes: 'Add' },
  'file-tracked': { kind: 'file-tracked', path: 'a.txt' },
  'file-untracked': { kind: 'file-untracked', path: 'a.txt' },
  'commit-count': { kind: 'commit-count', count: 2 },
  'config-set': { kind: 'config-set', key: 'user.name' },
  'config-equals': { kind: 'config-equals', key: 'user.name', value: 'Sam' },
  'config-cut-short': { kind: 'config-cut-short', key: 'user.name' },
  'config-multi-valued': { kind: 'config-multi-valued', key: 'user.name' },
  'last-command': {
    kind: 'last-command',
    startsWith: 'git log',
    allowFailure: true,
    namesCommit: { messageIncludes: 'Add' },
  },
  'current-folder': { kind: 'current-folder', path: 'todo-app' },
  'gh-authenticated': { kind: 'gh-authenticated' },
  'pr-open': { kind: 'pr-open', branch: 'feature' },
  'pr-merged': { kind: 'pr-merged', branch: 'feature' },
  not: { kind: 'not', check: LEAF },
  'all-of': { kind: 'all-of', checks: [LEAF] },
  'any-of': { kind: 'any-of', checks: [LEAF] },
}

describe('goalCheckSchema', () => {
  it.each(Object.entries(ONE_OF_EACH_KIND))('accepts a %s check with every field it declares', (_, check) => {
    expect(goalCheckSchema.safeParse(check).error).toBeUndefined()
  })
})
