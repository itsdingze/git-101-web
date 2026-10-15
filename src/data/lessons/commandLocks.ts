import type { CommandLocks } from '@/lib/git-sim/input/commandLocks'
import { lessons } from './index'

export function commandLocksFor(lessonId: number): CommandLocks {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId)
  if (lessonIndex < 0) return new Map()

  return new Map(
    lessons
      .slice(lessonIndex + 1)
      .flatMap((lesson) =>
        lesson.unlocks.map((name) => [name, lesson.title] as const),
      ),
  )
}
