import { describe, expect, it } from 'vitest'
import { playGitGraph } from './playGitGraph'

const HISTORY = [
  'git commit -m "chore: stop tracking debug.log"',
  'git commit -m "feat: add due dates"',
  'git commit -m "docs: add a README"',
]

const MAIN = { name: 'main', lane: 0 }
const SEARCH = { name: 'add-search', lane: 1 }
const BEFORE_SEARCH = [
  { id: 'c1', message: 'chore: stop tracking debug.log', branch: 'main', parents: [] },
  { id: 'c2', message: 'feat: add due dates', branch: 'main', parents: ['c1'] },
  { id: 'c3', message: 'docs: add a README', branch: 'main', parents: ['c2'] },
]
const SEARCH_WORK = { id: 'c4', message: 'feat: add search', branch: 'add-search', parents: ['c3'] }
const AFTER_SEARCH = [...BEFORE_SEARCH, SEARCH_WORK]

describe('playGitGraph', () => {
  it('draws a new branch from where you are, then its first commit', () => {
    const scenario = playGitGraph({
      setup: HISTORY,
      commands: ['git switch -c add-search', 'git commit -m "feat: add search"'],
    })

    expect(scenario).toEqual({
      commands: ['git switch -c add-search', 'git commit -m "feat: add search"'],
      stages: [
        { commits: BEFORE_SEARCH, branches: [MAIN], head: 'main' },
        { commits: BEFORE_SEARCH, branches: [MAIN, { ...SEARCH, startsAt: 'c3' }], head: 'add-search' },
        { commits: AFTER_SEARCH, branches: [MAIN, SEARCH], head: 'add-search' },
      ],
    })
  })

  it('ties two branches together with a merge commit named the way Git names it', () => {
    const scenario = playGitGraph({
      setup: [...HISTORY, 'git switch -c add-search', 'git commit -m "feat: add search"'],
      commands: ['git switch main', 'git commit -m "fix: hide due dates on finished tasks"', 'git merge add-search'],
    })

    const fix = { id: 'c5', message: 'fix: hide due dates on finished tasks', branch: 'main', parents: ['c3'] }
    const merge = { id: 'c6', message: "Merge branch 'add-search'", branch: 'main', parents: ['c5', 'c4'] }
    expect(scenario.stages).toEqual([
      { commits: AFTER_SEARCH, branches: [MAIN, SEARCH], head: 'add-search' },
      { commits: AFTER_SEARCH, branches: [MAIN, SEARCH], head: 'main' },
      { commits: [...AFTER_SEARCH, fix], branches: [MAIN, SEARCH], head: 'main' },
      { commits: [...AFTER_SEARCH, fix, merge], branches: [MAIN, SEARCH], head: 'main' },
    ])
  })

  it('names the branch merged into when it is not main', () => {
    const scenario = playGitGraph({
      setup: [...HISTORY, 'git switch -c add-search', 'git commit -m "feat: add search"', 'git switch main', 'git commit -m "fix: one"', 'git switch add-search'],
      commands: ['git merge main'],
    })

    const [, merged] = scenario.stages
    expect(merged?.commits.map((commit) => commit.message)).toContain("Merge branch 'main' into add-search")
  })

  it.each([
    ['git push', 'the diagram can only play git commit -m "...", git switch, git switch -c and git merge, not "git push"'],
    ['git switch nowhere', 'no branch "nowhere" to switch to'],
    ['git switch -c main', 'a branch "main" already exists'],
    ['git merge nowhere', 'no branch "nowhere" to merge'],
  ])('rejects "%s"', (command, message) => {
    expect(() => playGitGraph({ setup: HISTORY, commands: [command] })).toThrow(message)
  })

  it('rejects a branch made before the first commit', () => {
    expect(() => playGitGraph({ setup: [], commands: ['git switch -c add-search'] })).toThrow(
      'commit before "git switch -c add-search", since a branch starts from a commit',
    )
  })

  it('rejects a merge Git would fast-forward, since the diagram draws every merge as a merge commit', () => {
    const fastForward = () =>
      playGitGraph({
        setup: [...HISTORY, 'git switch -c add-search', 'git commit -m "feat: add search"', 'git switch main'],
        commands: ['git merge add-search'],
      })

    expect(fastForward).toThrow('"git merge add-search" would fast-forward, which the diagram can\'t draw')
  })
})
