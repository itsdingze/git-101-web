import { describe, expect, it } from 'vitest'
import type { Lesson, Step } from '@/types'
import { finishedEveryLesson, finishedEveryStep } from './lessonCompletion'

function lessonWithSteps(id: number, stepIds: string[]): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    description: 'D',
    unlocks: [],
    steps: stepIds.map((stepId) => ({ type: 'reading', id: stepId, content: [] }) as Step),
  }
}

describe('finishedEveryStep', () => {
  const lesson = lessonWithSteps(3, ['intro', 'practice'])

  it('is true only when every step of the lesson is done', () => {
    const done = new Set(['3:intro', '3:practice'])

    expect(finishedEveryStep(lesson, (lessonId, stepId) => done.has(`${lessonId}:${stepId}`))).toBe(true)
  })

  it('is false while any step is unfinished', () => {
    const done = new Set(['3:intro'])

    expect(finishedEveryStep(lesson, (lessonId, stepId) => done.has(`${lessonId}:${stepId}`))).toBe(false)
  })

  it('does not count the same step finished in another lesson', () => {
    const done = new Set(['4:intro', '4:practice'])

    expect(finishedEveryStep(lesson, (lessonId, stepId) => done.has(`${lessonId}:${stepId}`))).toBe(false)
  })
})

describe('finishedEveryLesson', () => {
  const lessons = [lessonWithSteps(1, []), lessonWithSteps(2, [])]

  it('is true once every lesson is done, in any order', () => {
    expect(finishedEveryLesson(lessons, [2, 1])).toBe(true)
  })

  it('is false while a lesson is left', () => {
    expect(finishedEveryLesson(lessons, [1])).toBe(false)
  })
})
