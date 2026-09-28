import { describe, expect, it } from 'vitest'
import { createSandbox } from '@/lib/git-sim/createSandbox'
import { evaluateGoal } from '@/lib/git-sim/goals'
import type { SandboxExerciseStep } from '@/types'
import lessons from './index'
import { commandLocksFor } from './commandLocks'

const SOLUTIONS: Record<string, readonly string[]> = {
  'find-your-feet': [
    'pwd',
    'ls',
    'cd desserts',
    'ls',
    'cd ..',
    'pwd',
    'echo "Try the ragu with less salt" > todo.txt',
    'git config --global user.name "Ada Lovelace"',
    'git config --global user.email "ada@example.com"',
    'git config user.name',
    'git commit -m "Add the first three recipes"',
  ],
  'first-repository-walkthrough': [
    'git init',
    'git status',
    'echo "Cut the second paragraph" > notes.txt',
    'git status',
  ],
  'first-commit-loop': [
    'git status',
    'git add .',
    'git status',
    'git commit -m "Initial commit"',
    'echo "The lighthouse had been dark for a year, and nobody had asked why." > chapter-one.md',
    'git diff',
    'git commit -am "Rewrite the opening line"',
    'git log --oneline',
  ],
  'ignore-rules-in-practice': [
    'git status',
    'git status --ignored',
    'git add -f error.log',
    'git commit -m "Track the error log on purpose"',
    'git rm --cached .env',
    'git commit -m "Stop tracking .env"',
    'git status --ignored',
  ],
  'branch-isolation-walkthrough': [
    'git switch -c add-navbar',
    'git add .',
    'git commit -m "Add navbar"',
    'git switch main',
    'ls',
    'git switch add-navbar',
    'ls',
  ],
  'merge-both-shapes': [
    'git switch main',
    'git merge add-navbar',
    'git merge fix-footer',
    'git log --oneline --graph',
    'git branch -d add-navbar',
    'git branch -d fix-footer',
  ],
  'conflict-merge-walkthrough': [
    'git merge opening-hours',
    'git status',
    'cat hours.txt',
    'echo "Open 7am to 6pm, every day." > hours.txt',
    'git add hours.txt',
    'git commit -m "Merge opening-hours"',
    'git log --oneline --graph',
  ],
  'stash-round-trip': [
    'git status',
    'git stash',
    'git status',
    'ls',
    'git stash -u',
    'ls',
    'echo "Sunday Kitchen, second edition 2026" > title-page.md',
    'git commit -am "Fix the year on the title page"',
    'git stash list',
    'git stash pop',
    'git status',
    'git stash pop',
    'git add .',
    'git commit -m "Add the pavlova recipe"',
  ],
  'fix-the-last-commit': [
    'git log --oneline',
    'git status',
    'git add chapter-02.md',
    'git commit --amend -m "Add the first two chapters"',
    'git log --oneline',
  ],
  'revert-a-bad-commit': [
    'git log --oneline',
    'git revert HEAD',
    'git log --oneline',
  ],
  'reflog-rescue': [
    'git add chapter-03-results.md',
    'git commit -m "Add the results chapter"',
    'git log --oneline',
    'git reset --hard HEAD~1',
    'ls',
    'git reflog',
    'git switch -c recovered af24571',
    'ls',
    'git log --oneline',
  ],
  'remote-round-trip': [
    'git pull origin main',
    'ls',
    'git add desserts.md',
    'git commit -m "Add the desserts chapter"',
    'git push',
    'cd ~',
    'git clone https://github.com/supper-club/cookbook.git check',
    'cd check',
    'ls',
  ],
  'feature-branch-workflow-practice': [
    'git pull origin main',
    'git switch -c feature/add-auth',
    'git add .',
    'git commit -m "feat: add login page"',
    'git push -u origin feature/add-auth',
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
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ])
  })

  it.each(sandboxSteps)('seeds cleanly for lesson $lessonId', async ({ step }) => {
    const sandbox = await createSandbox(step.seed)
    const snapshot = await sandbox.snapshot()

    const createsTheRepo = step.goals.some((goal) => goal.check.kind === 'repo-initialized')
    expect(snapshot.isRepo).toBe(!createsTheRepo)
    expect(step.goals.some((goal) => evaluateGoal(goal.check, snapshot))).toBe(false)
  })

  it.each(sandboxSteps)('is solvable for lesson $lessonId', async ({ lessonId, step }) => {
    const solution = SOLUTIONS[step.id]
    expect(solution, `no solution recorded for ${step.id}`).toBeDefined()

    const sandbox = await createSandbox(step.seed, commandLocksFor(lessonId))
    const latched = step.goals.map(() => false)

    for (const line of solution ?? []) {
      const result = await sandbox.run(line)
      const failure = result.outputs.find(
        (output) =>
          output.stream === 'stderr' && /^(fatal|error):|is taught in Lesson/m.test(output.text),
      )
      expect(failure?.text, `"${line}" failed in ${step.id}`).toBeUndefined()

      const snapshot = await sandbox.snapshot()
      if (step.mode === 'guided') {
        for (const [index, goal] of step.goals.entries()) {
          if (latched[index]) continue
          if (!evaluateGoal(goal.check, snapshot)) break
          latched[index] = true
        }
      } else {
        step.goals.forEach((goal, index) => {
          latched[index] = latched[index] || evaluateGoal(goal.check, snapshot)
        })
      }
    }

    const unmet = step.goals.filter((_, index) => !latched[index]).map((goal) => goal.id)
    expect(unmet).toEqual([])
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
