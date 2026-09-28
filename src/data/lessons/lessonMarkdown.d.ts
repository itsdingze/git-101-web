declare module '*.md' {
  import type { Lesson } from '@/types'

  const lesson: Lesson
  export default lesson
}
