import type { Lesson } from '@/types'
import lesson00 from './lesson00-what-is-git.md'
import lesson01 from './lesson01-the-terminal.md'
import lesson02 from './lesson02-start-a-project.md'
import lesson03 from './lesson03-first-commit.md'
import lesson04 from './lesson04-one-change-per-commit.md'
import lesson05 from './lesson05-branches-and-merging.md'
import lesson06 from './lesson06-undo-changes.md'
import lesson07 from './lesson07-read-your-history.md'
import lesson08 from './lesson08-put-it-on-github.md'
import lesson09 from './lesson09-work-with-a-team.md'
import lesson10 from './lesson10-teammates-changes.md'
import lesson11 from './lesson11-set-up-your-computer.md'
import lesson12 from './lesson12-use-git-on-your-computer.md'

export const lessons: Lesson[] = [
  lesson00, lesson01, lesson02, lesson03, lesson04, lesson05,
  lesson06, lesson07, lesson08, lesson09, lesson10, lesson11, lesson12,
]

export function lessonById(id: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id)
}
