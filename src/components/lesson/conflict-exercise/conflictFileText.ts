import type { ConflictExerciseStep } from '@/types'

function withSurroundings(step: ConflictExerciseStep, body: string): string {
  const before = step.surroundingBefore ? `${step.surroundingBefore}\n` : ''
  const after = step.surroundingAfter ? `\n${step.surroundingAfter}` : ''
  return `${before}${body}${after}`
}

export function composeConflictedFile(step: ConflictExerciseStep): string {
  const conflictBlock = [
    `<<<<<<< ${step.oursLabel}`,
    step.oursContent,
    '=======',
    step.theirsContent,
    `>>>>>>> ${step.theirsLabel}`,
  ].join('\n')

  return withSurroundings(step, conflictBlock)
}

export function composeResolvedFile(step: ConflictExerciseStep, resolution: string): string {
  return withSurroundings(step, resolution)
}
