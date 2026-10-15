import { describe, expect, it } from 'vitest'
import { lessonMarkdown } from './lessonMarkdownPlugin'

type Transform = (source: string, id: string) => unknown

describe('lessonMarkdown', () => {
  it('leaves Markdown outside the lessons folder to other plugins', async () => {
    const transform = lessonMarkdown().transform as Transform

    expect(await transform('# Git 101', '/project/README.md')).toBeNull()
  })
})
