import { describe, expect, it } from 'vitest'
import { lessonMarkdown } from './lessonMarkdownPlugin'

type Transform = (source: string, id: string) => unknown

const STORY = 'empty-checkpoint: []\n'

const LESSON = `---
id: 7
title: Demo
description: A demo lesson
unlocks: [status]
---

## Only step {#only-step}

Secret lesson body.
`

const transform = lessonMarkdown().transform as Transform

const buildContext = {
  addWatchFile: () => undefined,
  fs: { readFile: () => Promise.resolve(STORY) },
}

function exported(result: unknown): unknown {
  if (typeof result !== 'object' || result === null || !('code' in result) || typeof result.code !== 'string') {
    throw new Error('The plugin returned no code')
  }
  return JSON.parse(result.code.replace('export default ', ''))
}

describe('lessonMarkdown', () => {
  it('leaves Markdown outside the lessons folder to other plugins', async () => {
    expect(await transform('# Git 101', '/project/README.md')).toBeNull()
  })

  it('exports only what the course list needs for an outline import', async () => {
    const result = await transform.call(buildContext, LESSON, '/project/src/data/lessons/lesson07-demo.md?outline')

    expect(exported(result)).toEqual({ id: 7, title: 'Demo', description: 'A demo lesson', steps: [{ type: 'reading' }] })
  })

  it('still exports the whole lesson for a plain import', async () => {
    const result = await transform.call(buildContext, LESSON, '/project/src/data/lessons/lesson07-demo.md')

    expect(JSON.stringify(exported(result))).toContain('Secret lesson body.')
  })
})
