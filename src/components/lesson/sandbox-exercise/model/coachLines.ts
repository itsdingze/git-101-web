import type { SandboxDetour, SandboxExerciseStep, SandboxGoal } from '@/types'
import { hintAt } from '@/components/lesson/model/hintAt'
import { messages } from '@/messages/en'

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
  const { detour } = after
  const strayed = detour !== null && detour.id !== before.detour?.id
  const detourLines: CoachLine[] = strayed ? [{ kind: 'warning', text: detour.message }] : []
  const tipLines: CoachLine[] = tip && !strayed ? [{ kind: 'tip', text: tip }] : []
  return [...tipLines, ...detourLines, ...progressCoach(step, before, after)]
}

export function coachAfterClear(
  step: SandboxExerciseStep,
  before: CoachState,
  after: CoachState,
  tip: string | null,
): CoachLine[] {
  const shownByOpening = (line: CoachLine) => line.kind === 'goal' || (step.mode === 'goal' && line.kind === 'done')
  return coachAfterCommand(step, before, after, tip).filter((line) => !shownByOpening(line))
}

function progressCoach(step: SandboxExerciseStep, before: CoachState, after: CoachState): CoachLine[] {
  const newlyMet = step.goals.filter((_, index) => after.completed[index] && !before.completed[index])
  if (newlyMet.length === 0) return []

  const done: CoachLine[] = newlyMet.map((goal) => ({ kind: 'done', text: goal.label }))
  if (after.completed.every(Boolean)) return [...done, completionCoach(step)]
  return step.mode === 'guided' ? [...done, ...openingCoach(step, after.completed)] : done
}

export function hintCoach(goal: SandboxGoal, index: number): CoachLine {
  return { kind: 'hint', text: hintAt(goal.hints ?? [], index) }
}

function completionCoach(step: SandboxExerciseStep): CoachLine {
  return { kind: 'complete', text: step.completionMessage ?? messages.sandbox.exerciseComplete }
}
