import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals/goalChecks'
import type { SandboxExerciseStep } from '@/types'
import lessons from '@/data/lessons'
import { replaySandbox } from './replaySandbox'

const SOLUTIONS: Record<string, readonly string[]> = {
  'find-your-feet': [
    'pwd',
    'ls',
    'cd notes',
    'cat ideas.txt',
    'cd ..',
    'echo "Add search" > plan.txt',
    'echo "Add tags" >> plan.txt',
    'cat plan.txt',
  ],
  'sign-your-work': [
    'git config --global user.name "Ada Lovelace"',
    'git config --global user.email "ada@example.com"',
    'git config --list',
  ],
  'first-repository-walkthrough': [
    'git init',
    'git status',
    'echo "MAX_TASKS = 10" > settings.txt',
    'git status',
  ],
  'first-commit-loop': [
    'git status',
    'git add .',
    'git commit -m "feat: add task list"',
    'echo "MAX_TASKS = 20" > settings.txt',
    'git add settings.txt',
    'git commit -m "feat: raise the task limit"',
  ],
  'review-before-commit': [
    'echo "MAX_TASKS = 25" > settings.txt',
    'git diff',
    'git add settings.txt',
    'git diff --staged',
    'git commit -m "feat: raise the task limit to 25"',
    'git log --oneline',
    'git show',
  ],
  'ignore-rules-in-practice': [
    'ls -a',
    'git status',
    'echo ".env" > .gitignore',
    'git status',
    'echo "*.log" >> .gitignore',
    'echo "build/" >> .gitignore',
    'git status --ignored',
    'git add .',
    'git status',
    'git commit -m "feat: add task list"',
  ],
  'stop-tracking-log': [
    'git status --ignored',
    'git rm --cached debug.log',
    'git commit -m "chore: stop tracking debug.log"',
    'ls',
  ],
  'branch-isolation-walkthrough': [
    'git switch -c add-due-dates',
    'ls',
    'git status',
    'git add .',
    'git commit -m "feat: add due dates"',
    'git switch main',
    'ls',
    'git switch add-due-dates',
    'ls',
  ],
  'merge-due-dates': [
    'git switch main',
    'git merge add-due-dates',
    'git log --oneline --graph',
    'git branch -d add-due-dates',
  ],
  'conflict-merge-walkthrough': [
    'git merge raise-limit',
    'git status',
    'cat settings.txt',
    'echo "MAX_TASKS = 50" > settings.txt',
    'git add settings.txt',
    'git commit -m "Merge raise-limit"',
    'git log --oneline --graph',
  ],
  'stash-round-trip': [
    'git status',
    'git stash',
    'ls',
    'git stash -u',
    'ls',
    'echo "MAX_TASKS = 10" > settings.txt',
    'git add settings.txt',
    'git commit -m "fix: allow tasks again"',
    'git stash list',
    'git stash pop',
    'git stash pop',
    'git status',
  ],
  'fix-the-last-commit': [
    'git log --oneline',
    'git status',
    'git restore settings.txt',
    'git add search-help.txt',
    'git commit --amend -m "feat: add search"',
    'git log --oneline',
  ],
  'clone-the-team-project': [
    'git clone https://github.com/study-group/todo-app.git',
    'ls',
    'cd todo-app',
    'git log --oneline',
    'git remote -v',
  ],
  'remote-round-trip': [
    'git add tags.txt',
    'git commit -m "feat: add tags"',
    'git pull',
    'ls',
    'git push',
    'git status',
  ],
  'connect-new-project': [
    'git remote -v',
    'git remote add origin https://github.com/you/todo-app.git',
    'git push -u origin main',
    'git status',
  ],
  'feature-branch-workflow-practice': [
    'git pull',
    'git switch -c add-export',
    'git add .',
    'git commit -m "feat: add export"',
    'git push -u origin add-export',
  ],
  'revert-a-bad-commit': ['git log --oneline', 'git revert HEAD', 'git log --oneline', 'git push'],
  'reflog-rescue': [
    'git add archive.txt',
    'git commit -m "feat: add archive"',
    'git reset --hard HEAD~1',
    'ls',
    'git reflog',
    'git switch -c recovered HEAD@{1}',
    'ls',
  ],
  'fetch-then-pull': [
    'git status',
    'git fetch origin',
    'git status',
    'git log --oneline origin/main',
    'git pull',
    'ls',
  ],
}

const sandboxSteps = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is SandboxExerciseStep => step.type === 'sandbox-exercise')
    .map((step) => ({ lessonId: lesson.id, step })),
)

describe('every sandbox exercise', () => {
  it('covers every lesson that teaches a runnable command', () => {
    expect([...new Set(sandboxSteps.map(({ lessonId }) => lessonId))]).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21,
    ])
  })

  it.each(sandboxSteps)('seeds cleanly for lesson $lessonId', async ({ step }) => {
    const sandbox = await createSandbox(step.seed)
    const snapshot = await sandbox.snapshot()

    const createsTheRepo = step.goals.some((goal) => goal.check.kind === 'repo-initialized')
    const startsAsClone = step.seed.remote !== undefined && step.seed.remote.cloned !== false
    const plainFolder = !startsAsClone && !(step.seed.setup ?? []).some((seedStep) => 'run' in seedStep)
    expect(snapshot.isRepo).toBe(!createsTheRepo && !plainFolder)
    expect(step.goals.some((goal) => evaluateGoal(goal.check, snapshot))).toBe(false)
  })

  it.each(sandboxSteps)('is solvable for lesson $lessonId', async ({ step }) => {
    const solution = SOLUTIONS[step.id]
    expect(solution, `no solution recorded for ${step.id}`).toBeDefined()

    const result = await replaySandbox(step.id, solution ?? [])

    expect(result.failures).toEqual([])
    expect(step.goals.filter((_, index) => !result.completed[index]).map((goal) => goal.id)).toEqual([])
    expect(result.detour).toBeNull()
  })

  it.each(sandboxSteps)('has hints and a unique id per goal for lesson $lessonId', ({ step }) => {
    const ids = step.goals.map((goal) => goal.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(step.goals.every((goal) => (goal.hints?.length ?? 0) > 0)).toBe(true)
    if (step.mode === 'guided') {
      expect(step.goals.every((goal) => goal.narration !== undefined)).toBe(true)
    }
  })
})
