declare module '*.md' {
  import type { Lesson } from '@/types'

  const lesson: Lesson
  export default lesson
}

declare module '*/story.yaml' {
  import type { Story } from '@/lib/lesson-markdown/storySteps'

  const story: Story
  export default story
}
