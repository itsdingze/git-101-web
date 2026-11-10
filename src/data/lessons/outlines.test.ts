import { describe, expect, it } from 'vitest'
import { lessons } from './index'
import { lessonOutlines } from './outlines'

describe('lessonOutlines', () => {
  it('lists every lesson in course order with its step types', () => {
    expect(lessonOutlines).toEqual(
      lessons.map(({ id, title, description, steps }) => ({
        id,
        title,
        description,
        steps: steps.map(({ type }) => ({ type })),
      })),
    )
  })
})
