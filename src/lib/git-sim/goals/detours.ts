import { evaluateGoal, type GoalCheck } from './goalChecks'
import type { RepoSnapshot } from './snapshot'

type Detour = {
  id: string
  check: GoalCheck
  message: string
}

export function activeDetour<T extends Detour>(
  detours: readonly T[] | undefined,
  snapshot: RepoSnapshot,
): T | null {
  return detours?.find((detour) => evaluateGoal(detour.check, snapshot)) ?? null
}
