import { use } from 'react'
import { LessonNavContext } from '@/contexts/lessonNavCtx'
import type { LessonNavContextValue } from '@/types'

export function useLessonNav(): LessonNavContextValue {
  const context = use(LessonNavContext)
  if (!context) {
    throw new Error('useLessonNav must be used within a LessonNavProvider')
  }
  return context
}
