import { describe, expect, it } from 'vitest'
import { createSandbox, type Sandbox, type SandboxSeed, type SeedStep } from '@/lib/git-sim/createSandbox'
import type { SandboxExerciseStep } from '@/types'
import { lessons } from '@/data/lessons'
import story from '@/data/lessons/story.yaml'
import { SOLUTIONS, TEAM_URL, type SolutionStep } from './solutions'
import { saveInEditor } from './replaySandbox'

type Handover = {
  stepId: string
  then?: readonly string[]
  next: string
}

const HANDOVERS: readonly Handover[] = [
  { stepId: 'start-the-project', next: 'after-start-a-project' },
  { stepId: 'first-commit', next: 'after-first-commit' },
  { stepId: 'one-change-per-commit', next: 'after-one-change-per-commit' },
  { stepId: 'branch-and-merge', next: 'after-branches-and-merging' },
  { stepId: 'undo-a-layout', next: 'after-branches-and-merging' },
  { stepId: 'fix-the-last-commit', next: 'after-undo-changes' },
  { stepId: 'read-your-history', next: 'after-read-your-history' },
  { stepId: 'export-pull-request', next: 'team-after-work-with-a-team' },
  {
    stepId: 'resolve-a-conflict',
    then: [
      'git switch main',
      'git pull',
      'git merge --no-ff add-reminders -m "Merge pull request #3 from your-username/add-reminders"',
      'git commit --amend -m "Merge pull request #3 from your-username/add-reminders" -m "feat: add reminders"',
      'git push',
      'git branch -d add-reminders',
    ],
    next: 'team-after-reminders-merged',
  },
  {
    stepId: 'stash-and-pull',
    then: [
      'git switch -c name-the-app',
      'git add README.md',
      'git commit -m "docs: name the app Ticklist"',
      'git switch main',
      'git merge --no-ff name-the-app -m "Merge pull request #5 from your-username/name-the-app"',
      'git commit --amend -m "Merge pull request #5 from your-username/name-the-app" -m "docs: name the app Ticklist"',
      'git push',
      'git branch -d name-the-app',
    ],
    next: 'team-after-teammates-changes',
  },
]

type StoryState = {
  branch: string | null
  branches: string[]
  commits: string[]
  stashes: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  tracked: string[]
  files: Record<string, string>
  tracking: Record<string, { ahead: number; behind: number }>
}

function findSandboxStep(stepId: string): SandboxExerciseStep {
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type === 'sandbox-exercise' && step.id === stepId) return step
    }
  }
  throw new Error(`no sandbox step with id ${stepId}`)
}

function checkpointSteps(name: string): SeedStep[] {
  const steps = story[name]
  if (!steps) throw new Error(`no story checkpoint "${name}"`)
  return steps as SeedStep[]
}

function seedForCheckpoint(name: string): SandboxSeed {
  if (name.startsWith('team-')) {
    return {
      dir: 'projects/todo-app',
      remote: { name: 'origin', url: TEAM_URL, setup: checkpointSteps(name) },
      setup: [{ run: 'git config pull.rebase false' }],
    }
  }
  return { dir: 'projects/todo-app', setup: checkpointSteps(name) }
}

async function readStoryState(sandbox: Sandbox): Promise<StoryState> {
  const snapshot = await sandbox.snapshot()
  const files: Record<string, string> = {}
  for (const path of [...snapshot.workdirPaths].sort()) {
    const result = await sandbox.run(`cat ${path}`)
    files[path] = result.outputs.map((output) => output.text).join('\n')
  }

  return {
    branch: snapshot.branch,
    branches: [...snapshot.branches].sort(),
    commits: snapshot.commits.map((commit) => commit.message).sort(),
    stashes: snapshot.stashes.length,
    staged: snapshot.staged.map((change) => `${change.kind} ${change.path}`).sort(),
    unstaged: snapshot.unstaged.map((change) => `${change.kind} ${change.path}`).sort(),
    untracked: [...snapshot.untracked].sort(),
    tracked: [...snapshot.tracked].sort(),
    files,
    tracking: snapshot.tracking,
  }
}

async function runAll(sandbox: Sandbox, lines: readonly SolutionStep[]): Promise<string[]> {
  const failures: string[] = []
  for (const line of lines) {
    if (typeof line !== 'string') {
      await saveInEditor(sandbox, line)
      continue
    }
    const result = await sandbox.run(line)
    for (const output of result.outputs) {
      if (output.stream === 'stderr' && /^(fatal|error):/m.test(output.text)) failures.push(`${line}: ${output.text}`)
    }
  }
  return failures
}

describe('the story', () => {
  it('runs through its checkpoints in lesson order', () => {
    expect(Object.keys(story)).toEqual([
      'home-files',
      'project-files',
      'after-start-a-project',
      'after-first-commit',
      'changes-for-lesson-4',
      'after-one-change-per-commit',
      'changes-for-lesson-5',
      'after-branches-and-merging',
      'changes-for-lesson-6a',
      'lesson-6b-hurried-commit',
      'after-undo-changes',
      'changes-for-lesson-7',
      'after-read-your-history',
      'team-after-put-it-on-github',
      'changes-for-lesson-9',
      'team-after-work-with-a-team',
      'reminders-branch',
      'sam-fixes-the-list',
      'team-after-reminders-merged',
      'changes-for-lesson-10b',
      'sam-explains-the-tasks-file',
      'team-after-teammates-changes',
    ])
  })

  it.each(HANDOVERS)('continues from $stepId into $next', async ({ stepId, then, next }) => {
    const step = findSandboxStep(stepId)
    const solution = SOLUTIONS[stepId]
    expect(solution, `no solution recorded for ${stepId}`).toBeDefined()

    const played = await createSandbox(step.seed)
    expect(await runAll(played, [...(solution ?? []), ...(then ?? [])])).toEqual([])

    const expected = await createSandbox(seedForCheckpoint(next))

    expect(await readStoryState(played)).toEqual(await readStoryState(expected))
  }, 30_000)
})
