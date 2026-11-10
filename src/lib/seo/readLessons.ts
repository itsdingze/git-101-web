import type { Rollup } from 'vite'
import { parseLesson } from '../lesson-markdown/parseLesson'
import { parseStory } from '../lesson-markdown/parseStory'
import type { LessonArticle } from './staticBody'

const LESSONS_FOLDER = 'src/data/lessons'

export async function readLessons(fs: Rollup.RollupFsModule, root: string): Promise<LessonArticle[]> {
  const folder = `${root}/${LESSONS_FOLDER}`
  const story = parseStory(await fs.readFile(`${folder}/story.yaml`, { encoding: 'utf8' }))
  const files = (await fs.readdir(folder)).filter((name) => name.endsWith('.md'))

  const lessons = await Promise.all(
    files.map(async (name) => {
      const { id, title, description, steps } = parseLesson(
        await fs.readFile(`${folder}/${name}`, { encoding: 'utf8' }),
        `${LESSONS_FOLDER}/${name}`,
        story,
      )
      return { id, title, description, steps }
    }),
  )
  return lessons.sort((a, b) => a.id - b.id)
}
