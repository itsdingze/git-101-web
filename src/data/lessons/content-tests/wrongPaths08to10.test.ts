import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SeedStep } from '@/lib/git-sim/createSandbox'
import { textOf } from '@/lib/git-sim/scenarios/textOf'
import story from '@/data/lessons/story.yaml'
import { lessons } from '@/data/lessons'
import type { SandboxExerciseStep } from '@/types'
import { replaySandbox } from './replaySandbox'
import { SETTLED_APP_PY, SOLUTIONS, TEAM_URL, type SolutionStep } from './solutions'

const prefixesOf = (lines: readonly SolutionStep[]) => lines.map((_, index) => lines.slice(0, index + 1))

describe.each(['push-to-github', 'clone-on-a-laptop', 'export-pull-request', 'resolve-a-conflict', 'stash-and-pull'])(
  'the happy path through %s',
  (stepId) => {
    it('never shows a detour on the way', async () => {
      for (const prefix of prefixesOf(SOLUTIONS[stepId] ?? [])) {
        const result = await replaySandbox(stepId, prefix)

        expect(result.detour, JSON.stringify(prefix[prefix.length - 1])).toBeNull()
      }
    }, 60_000)
  },
)

function sandboxStep(stepId: string): SandboxExerciseStep {
  const step = lessons
    .flatMap((lesson) => lesson.steps)
    .find((candidate): candidate is SandboxExerciseStep => candidate.type === 'sandbox-exercise' && candidate.id === stepId)
  if (!step) throw new Error(`no sandbox step with id ${stepId}`)
  return step
}

async function historyOfAClone(sandbox: Sandbox): Promise<string> {
  await sandbox.run('cd ~')
  await sandbox.run(`git clone ${TEAM_URL} laptop`)
  await sandbox.run('cd laptop')
  return textOf(sandbox, 'git log --oneline')
}

const SIGNED_IN = ['gh auth login --with-token < ~/token.txt', 'gh auth status']
const CONNECTED = [...SIGNED_IN, `git remote add origin ${TEAM_URL}`]

describe('lesson 8: push to GitHub', () => {
  it('leaves GitHub holding the history the laptop clones', async () => {
    const pushed = await createSandbox(sandboxStep('push-to-github').seed)
    for (const line of SOLUTIONS['push-to-github'] ?? []) await pushed.run(line as string)

    const github = await createSandbox({
      dir: '',
      remote: { name: 'origin', url: TEAM_URL, cloned: false, setup: story['team-after-put-it-on-github'] as SeedStep[] },
    })

    expect(await historyOfAClone(pushed)).toBe(await historyOfAClone(github))
  })

  it('explains the token when gh auth login runs without one', async () => {
    const result = await replaySandbox('push-to-github', ['gh auth login'])

    expect(result.completed).toEqual([false, false, false])
    expect(result.detour).toBeNull()
  })

  it('explains a push without -u', async () => {
    const result = await replaySandbox('push-to-github', [...CONNECTED, 'git push origin main'])

    expect(result.completed).toEqual([true, false, false])
    expect(result.detour).toBe('pushed-without-upstream')
  })

  it('finishes once a push with -u pairs the branches', async () => {
    const result = await replaySandbox('push-to-github', [...CONNECTED, 'git push origin main', 'git push -u origin main', 'git status'])

    expect(result.completed).toEqual([true, true, true])
    expect(result.detour).toBeNull()
  })

  it('lets GitHub refuse a mistyped address', async () => {
    const result = await replaySandbox('push-to-github', [
      ...SIGNED_IN,
      'git remote add origin https://github.com/your-username/todo.git',
      'git push -u origin main',
    ])

    expect(result.failures).toHaveLength(1)
    expect(result.completed).toEqual([true, false, false])
  })

  it('counts a push made before signing in once gh is signed in', async () => {
    const result = await replaySandbox('push-to-github', [
      `git remote add origin ${TEAM_URL}`,
      'git push -u origin main',
      ...SIGNED_IN,
      'git status',
    ])

    expect(result.completed).toEqual([true, true, true])
  })
})

describe('lesson 8: clone on a laptop', () => {
  it('accepts git clone with the address', async () => {
    const result = await replaySandbox('clone-on-a-laptop', [`git clone ${TEAM_URL}`, 'cd todo-app', 'git log --oneline'])

    expect(result.completed).toEqual([true, true, true])
    expect(result.detour).toBeNull()
  })

  it('waits for git log until you are inside the clone', async () => {
    const result = await replaySandbox('clone-on-a-laptop', ['gh repo clone your-username/todo-app', 'git log --oneline'])

    expect(result.failures).toHaveLength(1)
    expect(result.completed).toEqual([true, false, false])
  })

  it('explains a second clone made inside the first', async () => {
    const result = await replaySandbox('clone-on-a-laptop', [
      'gh repo clone your-username/todo-app',
      'cd todo-app',
      'gh repo clone your-username/todo-app',
    ])

    expect(result.detour).toBe('clone-nested')
  })

  it('waits for Start over once a second clone is inside the first', async () => {
    const result = await replaySandbox('clone-on-a-laptop', [
      'gh repo clone your-username/todo-app',
      'cd todo-app',
      'gh repo clone your-username/todo-app',
      'git log --oneline',
    ])

    expect(result.completed).toEqual([true, true, false])
    expect(result.detour).toBe('clone-nested')
  })
})

const ON_BRANCH = ['git pull', 'git switch -c add-export']
const COMMITTED = [...ON_BRANCH, 'git add export.py app.py', 'git commit -m "feat: add export"']
const OPENED = [...COMMITTED, 'git push -u origin add-export', 'gh pr create --fill', 'gh pr view']

describe('lesson 9: the team loop', () => {
  it('explains export committed on main', async () => {
    const result = await replaySandbox('export-pull-request', ['git pull', 'git add export.py app.py', 'git commit -m "feat: add export"'])

    expect(result.completed).toEqual([true, false, false, false, false, false])
    expect(result.detour).toBe('export-on-main')
  })

  it('explains a branch pushed without -u', async () => {
    const result = await replaySandbox('export-pull-request', [...COMMITTED, 'git push origin add-export'])

    expect(result.completed).toEqual([true, true, true, false, false, false])
    expect(result.detour).toBe('pushed-without-upstream')
  })

  it('lets gh refuse a pull request for a branch GitHub does not have', async () => {
    const result = await replaySandbox('export-pull-request', [...COMMITTED, 'gh pr create --fill'])

    expect(result.completed).toEqual([true, true, true, false, false, false])
    expect(result.detour).toBeNull()
  })

  it('waits for gh pr view after the pull request opens', async () => {
    const result = await replaySandbox('export-pull-request', OPENED.slice(0, -1))

    expect(result.completed).toEqual([true, true, true, true, false, false])
  })

  it('lets gh ask for a merge method', async () => {
    const result = await replaySandbox('export-pull-request', [...OPENED, 'gh pr merge 1'])

    expect(result.completed).toEqual([true, true, true, true, true, false])
    expect(result.detour).toBeNull()
  })

  it('explains a merge that leaves the branch behind', async () => {
    const result = await replaySandbox('export-pull-request', [...OPENED, 'gh pr merge 1 --merge'])

    expect(result.completed).toEqual([true, true, true, true, true, false])
    expect(result.detour).toBe('merged-branch-left')
  })

  it('finishes once the branch is tidied by hand', async () => {
    const result = await replaySandbox('export-pull-request', [
      ...OPENED,
      'gh pr merge 1 --merge',
      'git switch main',
      'git pull',
      'git branch -d add-export',
    ])

    expect(result.completed).toEqual([true, true, true, true, true, true])
    expect(result.detour).toBeNull()
  })
})

const CONFLICTED = ['git pull origin main']
const BOTH_LINES_KEPT = SETTLED_APP_PY.replace('    # Show only open tasks with reminders.', '    # Show all tasks with reminders.\n    # Show only open tasks.')
const SAMS_FIX_DROPPED = SETTLED_APP_PY.replace('    # Show only open tasks with reminders.', '    # Show all tasks with reminders.')
const HASH_LINE_LEFT = SETTLED_APP_PY.replace(
  '    # Show only open tasks with reminders.',
  '    # Show only open tasks with reminders.\nb91d1904bee4416e838afa0bcc6d574e449c2d3c',
)
const NO_SHOW_LINE = SETTLED_APP_PY.replace('    # Show only open tasks with reminders.\n', '')

describe('lesson 10: settle a conflict', () => {
  it('waits when plain git pull finds nothing new on add-reminders', async () => {
    const result = await replaySandbox('resolve-a-conflict', ['git pull'])

    expect(result.completed).toEqual([false, false, false, false])
  })

  it('counts a file saved from the editor panel', async () => {
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, { write: { 'app.py': SETTLED_APP_PY } }])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBeNull()
  })

  it.each([
    ['both versions kept on separate lines', BOTH_LINES_KEPT],
    ["a resolution that drops Sam's fix", SAMS_FIX_DROPPED],
    ['a leftover hash line', HASH_LINE_LEFT],
  ])('explains %s', async (_, appPy) => {
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, { write: { 'app.py': appPy } }])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('resolution-off')
  })

  it('keeps explaining a wrong resolution once it is committed', async () => {
    const result = await replaySandbox('resolve-a-conflict', [
      ...CONFLICTED,
      { write: { 'app.py': SAMS_FIX_DROPPED } },
      'git add app.py',
      'git commit --no-edit',
    ])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('resolution-committed-off')
  })

  it('accepts a resolution with extra blank lines', async () => {
    const spaced = SETTLED_APP_PY.replace('    # Show only open tasks with reminders.\n', '    # Show only open tasks with reminders.\n\n')
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, { write: { 'app.py': spaced } }])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBeNull()
  })

  it('explains a resolution that changed the surrounding code', async () => {
    const changed = SETTLED_APP_PY.replace('def show_due_dates() -> None:', 'def show_dates() -> None:')
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, { write: { 'app.py': changed } }])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('resolution-off')
  })

  it('explains a save that drops both show lines', async () => {
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, { write: { 'app.py': NO_SHOW_LINE } }])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('show-line-lost')
  })

  it('explains app.py staged with its markers', async () => {
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, 'git add app.py'])

    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBe('markers-staged')
  })

  it('explains markers committed in the merge', async () => {
    const result = await replaySandbox('resolve-a-conflict', [...CONFLICTED, 'git add app.py', 'git commit --no-edit'])

    expect(result.detour).toBe('markers-committed')
  })

  it('finishes when main is merged in by hand', async () => {
    const result = await replaySandbox('resolve-a-conflict', [
      'git switch main',
      'git pull',
      'git switch add-reminders',
      'git merge main',
      { write: { 'app.py': SETTLED_APP_PY } },
      'git add app.py',
      'git commit --no-edit',
      'git push',
    ])

    expect(result.completed).toEqual([true, true, true, true])
    expect(result.detour).toBeNull()
  })
})

describe('lesson 10: stash and pull', () => {
  it("lets Git refuse the pull over your edit with Git's own message", async () => {
    const result = await replaySandbox('stash-and-pull', ['git pull'])

    expect(result.failures).toHaveLength(1)
    expect(result.completed).toEqual([true, false, false, false])
    expect(result.detour).toBeNull()
  })

  it('finishes after the refused pull', async () => {
    const result = await replaySandbox('stash-and-pull', ['git pull', 'git stash', 'git pull', 'git stash pop'])

    expect(result.completed).toEqual([true, true, true, true])
    expect(result.detour).toBeNull()
  })

  it('waits when the edit is popped back before pulling', async () => {
    const result = await replaySandbox('stash-and-pull', ['git stash', 'git stash pop'])

    expect(result.completed).toEqual([true, true, false, false])
    expect(result.detour).toBeNull()
  })

  it('explains an edit thrown away with git restore', async () => {
    const result = await replaySandbox('stash-and-pull', ['git pull', 'git restore README.md'])

    expect(result.detour).toBe('edit-thrown-away')
  })

  it('explains the edit committed straight to main', async () => {
    const result = await replaySandbox('stash-and-pull', ['git add README.md', 'git commit -m "docs: name the app Ticklist"'])

    expect(result.detour).toBe('committed-on-main')
  })
})
