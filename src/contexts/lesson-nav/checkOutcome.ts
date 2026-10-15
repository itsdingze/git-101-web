import type { LessonNavState } from './lessonNav'

export function checkOutcome(
  result: boolean | undefined,
  holdIncorrect: boolean,
): LessonNavState['checkResult'] {
  if (result === true) return 'correct'
  if (result === false && holdIncorrect) return 'incorrect'
  return null
}
