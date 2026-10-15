import { describe, expect, it } from 'vitest'
import type { Lesson, Step } from '@/types'
import { lessonMinutes } from './lessonMinutes'

function lessonOf(types: Step['type'][]): Lesson {
  return {
    id: 0,
    title: 'T',
    description: 'D',
    unlocks: [],
    steps: types.map((type, index) => ({ type, id: String(index) }) as Step),
  }
}

describe('lessonMinutes', () => {
  it('rounds the step estimate up to the next five minutes', () => {
    expect(lessonMinutes(lessonOf(['reading', 'reading', 'quiz']))).toBe(5)
    expect(lessonMinutes(lessonOf(['reading', 'sandbox-exercise', 'sandbox-exercise']))).toBe(10)
  })

  it('weighs hands-on steps more than reading', () => {
    expect(lessonMinutes(lessonOf(['sandbox-exercise', 'block-exercise', 'quiz', 'reading']))).toBe(10)
  })
})
