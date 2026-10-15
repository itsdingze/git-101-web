type HintProgress = {
  goalId: string
  next: number
}

interface ShownHint {
  index: number
  progress: HintProgress
}

export const NO_HINTS_SHOWN: HintProgress = { goalId: '', next: 0 }

export function nextHint(progress: HintProgress, goalId: string): ShownHint {
  const index = progress.goalId === goalId ? progress.next : 0
  return { index, progress: { goalId, next: index + 1 } }
}
