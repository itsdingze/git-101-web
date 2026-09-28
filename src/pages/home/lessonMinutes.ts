import type { Lesson, Step } from '@/types'

const MINUTES_PER_STEP: Record<Step['type'], number> = {
  reading: 1,
  quiz: 1,
  'block-exercise': 1,
  'conflict-exercise': 2,
  'sandbox-exercise': 4,
}

const ROUNDING = 5

export default function lessonMinutes(lesson: Lesson): number {
  const total = lesson.steps.reduce((sum, step) => sum + MINUTES_PER_STEP[step.type], 0)
  return Math.max(ROUNDING, Math.ceil(total / ROUNDING) * ROUNDING)
}
