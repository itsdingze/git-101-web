import type { Plugin } from 'vite'
import parseLesson from './parseLesson'
import parseStory from './parseStory'

const STORY_FILE = 'story.yaml'

function lessonModule(lesson: unknown): string {
  return [
    `import story from './${STORY_FILE}'`,
    `import { withStorySeeds } from '@/lib/lesson-markdown/storySteps'`,
    `export default withStorySeeds(${JSON.stringify(lesson)}, story)`,
  ].join('\n')
}

export default function lessonMarkdown(): Plugin {
  return {
    name: 'lesson-markdown',
    transform(source, id) {
      if (id.endsWith(STORY_FILE)) return { code: `export default ${JSON.stringify(parseStory(source))}`, map: null }
      if (!id.endsWith('.md')) return null

      const fileName = id.replace(/^.*[/\\](src[/\\])/, '$1')
      return { code: lessonModule(parseLesson(source, fileName)), map: null }
    },
  }
}
