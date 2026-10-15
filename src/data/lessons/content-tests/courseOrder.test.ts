import { describe, expect, it } from 'vitest'
import { lessons } from '@/data/lessons'

describe('course sequence', () => {
  it('numbers each lesson by its place in the course', () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(lessons.map((_, index) => index))
  })

  it('finishes every sandbox practice before computer setup', () => {
    const setupIndex = lessons.findIndex((lesson) => lesson.title === 'Set up your computer')
    const practiceIndexes = lessons.flatMap((lesson, index) =>
      lesson.steps.some((step) => step.type === 'sandbox-exercise') ? [index] : [],
    )

    expect(setupIndex).toBeGreaterThan(Math.max(...practiceIndexes))
  })
})

describe('the final computer walkthrough', () => {
  it('ends with a website merge followed by a local pull', () => {
    const finalLesson = lessons[lessons.length - 1]
    expect(finalLesson?.id).toBe(12)
    const ids = finalLesson?.steps.map((step) => step.id) ?? []
    expect(ids.indexOf('open-pull-request')).toBeLessThan(ids.indexOf('review-and-merge'))
    expect(ids.indexOf('review-and-merge')).toBeLessThan(ids.indexOf('pull-merged-change'))
    const contents = JSON.stringify(finalLesson?.steps)
    expect(contents).toContain('gh pr view --web')
    expect(contents).not.toContain('gh pr merge')
  })
})
