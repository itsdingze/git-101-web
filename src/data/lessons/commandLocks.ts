import type { CommandLocks } from '@/lib/git-sim/commandLocks'
import lessons from './index'

export function commandLocksFor(lessonId: number): CommandLocks {
  return new Map(
    lessons
      .filter((lesson) => lesson.id > lessonId)
      .flatMap((lesson) =>
        lesson.unlocks.map((name) => [name, `Lesson ${lesson.id}: ${lesson.title}`] as const),
      ),
  )
}
