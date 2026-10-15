import { describe, expect, it } from 'vitest'
import type { Lesson, Step } from '@/types'
import { initialStepIndex } from './initialStepIndex'

const lesson: Lesson = {
  id: 2,
  title: 'Lesson',
  description: 'D',
  unlocks: [],
  steps: ['a', 'b', 'c'].map((id) => ({ type: 'reading', id, content: [] }) as Step),
}

describe('initialStepIndex', () => {
  it('resumes at the saved step', () => {
    expect(initialStepIndex(lesson, { lessonCompleted: false, savedStep: 1 })).toBe(1)
  })

  it('resumes at the last step when the saved step is past the end', () => {
    expect(initialStepIndex(lesson, { lessonCompleted: false, savedStep: 7 })).toBe(2)
  })

  it('starts a finished lesson from the beginning', () => {
    expect(initialStepIndex(lesson, { lessonCompleted: true, savedStep: 2 })).toBe(0)
  })

  it('starts at the beginning when the lesson does not exist', () => {
    expect(initialStepIndex(undefined, { lessonCompleted: false, savedStep: 2 })).toBe(0)
  })
})
