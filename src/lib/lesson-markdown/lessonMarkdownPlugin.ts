import type { Plugin } from 'vite'
import { parseLesson } from './parseLesson'
import { parseStory } from './parseStory'

const STORY_FILE = 'story.yaml'
const LESSONS_FOLDER = /[/\\]src[/\\]data[/\\]lessons[/\\][^/\\]+$/

function storyBeside(id: string): string {
  return id.replace(/[^/\\]+$/, STORY_FILE)
}

export function lessonMarkdown(): Plugin {
  return {
    name: 'lesson-markdown',
    async transform(source, id) {
      if (!LESSONS_FOLDER.test(id)) return null
      if (id.endsWith(STORY_FILE)) return { code: `export default ${JSON.stringify(parseStory(source))}`, map: null }
      if (!id.endsWith('.md')) return null

      const storyPath = storyBeside(id)
      this.addWatchFile(storyPath)
      const story = parseStory(await this.fs.readFile(storyPath, { encoding: 'utf8' }))
      const fileName = id.replace(/^.*[/\\](src[/\\])/, '$1')
      return { code: `export default ${JSON.stringify(parseLesson(source, fileName, story))}`, map: null }
    },
  }
}
