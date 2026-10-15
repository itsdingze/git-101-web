import { evaluateGoal, type GoalCheck } from './goalChecks'
import type { RepoSnapshot } from './snapshot'

type Detour = {
  id: string
  untilGoal?: string
  check: GoalCheck
  message: string
}

export function activeDetour<T extends Detour>(
  detours: readonly T[] | undefined,
  snapshot: RepoSnapshot,
  completedGoals: ReadonlySet<string> = new Set(),
): T | null {
  return (
    detours?.find(
      (detour) =>
        (detour.untilGoal === undefined || !completedGoals.has(detour.untilGoal)) &&
        evaluateGoal(detour.check, snapshot),
    ) ?? null
  )
}
