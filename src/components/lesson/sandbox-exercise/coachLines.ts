import type { SandboxDetour, SandboxExerciseStep, SandboxGoal } from '@/types'

export type CoachKind = 'goal' | 'done' | 'tip' | 'warning' | 'hint' | 'complete'

export type CoachLine = {
  kind: CoachKind
  text: string
}

export type CoachState = {
  completed: readonly boolean[]
  detour: SandboxDetour | null
}

export function openingCoach(step: SandboxExerciseStep, completed: readonly boolean[]): CoachLine[] {
  if (step.mode === 'goal') {
    return step.goals.map((goal, index) => ({ kind: completed[index] ? 'done' : 'goal', text: goal.label }))
  }

  const active = step.goals.find((_, index) => !completed[index])
  return active ? [{ kind: 'goal', text: active.narration ?? active.label }] : []
}

export function coachAfterCommand(
  step: SandboxExerciseStep,
  before: CoachState,
  after: CoachState,
  tip: string | null,
): CoachLine[] {
  const tipLines: CoachLine[] = tip ? [{ kind: 'tip', text: tip }] : []
  const { detour } = after
  const strayed = detour !== null && detour.id !== before.detour?.id
  const detourLines: CoachLine[] = strayed ? [{ kind: 'warning', text: detour.message }] : []
  return [...tipLines, ...detourLines, ...progressCoach(step, before, after)]
}

function progressCoach(step: SandboxExerciseStep, before: CoachState, after: CoachState): CoachLine[] {
  const newlyMet = step.goals.filter((_, index) => after.completed[index] && !before.completed[index])
  if (newlyMet.length === 0) return []

  const done: CoachLine[] = newlyMet.map((goal) => ({ kind: 'done', text: goal.label }))
  if (after.completed.every(Boolean)) return [...done, completionCoach(step)]
  return step.mode === 'guided' ? [...done, ...openingCoach(step, after.completed)] : done
}

export function hintCoach(goal: SandboxGoal, index: number): CoachLine {
  const hints = goal.hints ?? []
  return { kind: 'hint', text: hints[Math.min(index, hints.length - 1)] ?? '' }
}

function completionCoach(step: SandboxExerciseStep): CoachLine {
  return { kind: 'complete', text: step.completionMessage ?? 'Exercise complete.' }
}
