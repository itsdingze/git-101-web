import type { Lesson } from '@/types'
import lesson00 from './lesson00-what-is-git'
import lesson01 from './lesson01-how-you-work'
import lesson02 from './lesson02-first-repository'
import lesson03 from './lesson03-first-commit'
import lesson04 from './lesson04-gitignore'
import lesson05 from './lesson05-branching'
import lesson06 from './lesson06-merging'
import lesson07 from './lesson07-merge-conflicts'
import lesson08 from './lesson08-stashing'
import lesson09 from './lesson09-fixing-mistakes'
import lesson10 from './lesson10-remotes'
import lesson11 from './lesson11-team-workflow'
import lesson12 from './lesson12-ship-to-github'

const lessons: Lesson[] = [
  lesson00, lesson01, lesson02, lesson03,
  lesson04, lesson05, lesson06, lesson07,
  lesson08, lesson09, lesson10, lesson11,
  lesson12,
]

export default lessons
