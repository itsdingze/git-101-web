import type { RepoSnapshot } from '@/lib/git-sim/goals/snapshot'
import { completedGoalIds, latchGoals } from '@/lib/git-sim/goals/goalProgress'
import { activeDetour } from '@/lib/git-sim/goals/detours'
import type { SandboxExerciseStep } from '@/types'
import type { CoachState } from './coachLines'

export function startingCoachState(step: SandboxExerciseStep): CoachState {
  return { completed: step.goals.map(() => false), detour: null }
}

export function advanceCoachState(step: SandboxExerciseStep, previous: CoachState, snapshot: RepoSnapshot): CoachState {
  const checks = step.goals.map((goal) => goal.check)
  const completed = latchGoals(step.mode, checks, previous.completed, snapshot)
  const detour = completed.every(Boolean)
    ? null
    : activeDetour(step.detours, snapshot, completedGoalIds(step.goals, completed))
  return { completed, detour }
}

export function activeGoalIndex(completed: readonly boolean[]): number {
  const firstIncomplete = completed.findIndex((done) => !done)
  return firstIncomplete === -1 ? completed.length - 1 : firstIncomplete
}
