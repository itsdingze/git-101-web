import type { LessonOutline } from '@/types'

const modules = import.meta.glob<LessonOutline>('./lesson*.md', { query: '?outline', import: 'default', eager: true })

export const lessonOutlines: LessonOutline[] = Object.values(modules).sort((a, b) => a.id - b.id)
