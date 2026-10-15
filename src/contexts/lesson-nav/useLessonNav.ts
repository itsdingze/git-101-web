import { use } from 'react'
import { LessonNavContext } from './lessonNavContext'
import type { LessonNavContextValue } from './lessonNav'

export function useLessonNav(): LessonNavContextValue {
  const context = use(LessonNavContext)
  if (!context) {
    throw new Error('useLessonNav must be used within a LessonNavProvider')
  }
  return context
}
