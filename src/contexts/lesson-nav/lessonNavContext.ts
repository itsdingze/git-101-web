import { createContext } from 'react'
import type { LessonNavContextValue } from './lessonNav'

export const LessonNavContext = createContext<LessonNavContextValue | null>(null)
