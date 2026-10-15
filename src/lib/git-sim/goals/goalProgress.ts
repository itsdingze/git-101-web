import { evaluateGoal, type GoalCheck } from './goalChecks'
import type { RepoSnapshot } from './snapshot'

type GoalMode = 'goal' | 'guided'

export function latchGoals(
  mode: GoalMode,
  checks: readonly GoalCheck[],
  previous: readonly boolean[],
  snapshot: RepoSnapshot,
): boolean[] {
  if (mode === 'goal') {
    return checks.map((check, index) => (previous[index] ?? false) || evaluateGoal(check, snapshot))
  }

  const reached = checks.map((_, index) => previous[index] ?? false)
  for (const [index, check] of checks.entries()) {
    if (reached[index]) continue
    if (!evaluateGoal(check, snapshot)) break
    reached[index] = true
  }
  return reached
}

export function completedGoalIds(goals: readonly { id: string }[], completed: readonly boolean[]): Set<string> {
  return new Set(goals.filter((_, index) => completed[index]).map((goal) => goal.id))
}
