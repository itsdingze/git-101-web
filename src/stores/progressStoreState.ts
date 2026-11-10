import { isRecord } from '@/lib/isRecord'
import type { LearnerIdentity, ProgressState } from './progress'

export const EMPTY_PROGRESS: ProgressState = {
  completedLessons: [],
  completedSteps: {},
  currentStep: {},
  identity: null,
}

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function parseCompletedLessons(value: unknown): number[] {
  return Array.isArray(value) ? value.filter(isWholeNumber) : []
}

function parseCompletedSteps(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.keys(value).filter((key) => value[key] === true).map((key) => [key, true]))
}

function parseCurrentStep(value: unknown): Record<number, number> {
  if (!isRecord(value)) return {}
  const steps: Record<number, number> = {}
  for (const [lesson, step] of Object.entries(value)) {
    if (isWholeNumber(Number(lesson)) && isWholeNumber(step)) steps[Number(lesson)] = step
  }
  return steps
}

function parseIdentity(value: unknown): LearnerIdentity | null {
  if (!isRecord(value)) return null
  const { name, email } = value
  return typeof name === 'string' && typeof email === 'string' ? { name, email } : null
}

export function parseProgress(saved: unknown): ProgressState {
  if (!isRecord(saved)) return EMPTY_PROGRESS
  return {
    completedLessons: parseCompletedLessons(saved.completedLessons),
    completedSteps: parseCompletedSteps(saved.completedSteps),
    currentStep: parseCurrentStep(saved.currentStep),
    identity: parseIdentity(saved.identity),
  }
}

export function mergeProgress<T extends ProgressState>(saved: unknown, current: T): T {
  const progress = parseProgress(saved)
  return {
    ...current,
    completedLessons: [...new Set([...current.completedLessons, ...progress.completedLessons])],
    completedSteps: { ...current.completedSteps, ...progress.completedSteps },
    currentStep: { ...current.currentStep, ...progress.currentStep },
    identity: progress.identity ?? current.identity,
  }
}
