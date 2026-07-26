import { createContext } from 'react'
import type { LessonNavContextValue } from '@/types'

export const LessonNavContext = createContext<LessonNavContextValue | null>(null)
