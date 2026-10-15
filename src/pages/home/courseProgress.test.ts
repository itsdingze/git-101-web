import { describe, expect, it } from 'vitest'
import type { Lesson } from '@/types'
import { courseProgress, lessonStatuses } from './courseProgress'

function lesson(id: number): Lesson {
  return { id, title: `Lesson ${id}`, description: 'D', unlocks: [], steps: [] }
}

const LESSONS = [lesson(1), lesson(2), lesson(3)]

describe('courseProgress', () => {
  it('points a new learner at the first lesson', () => {
    expect(courseProgress(LESSONS, [])).toEqual({ nextLesson: LESSONS[0], hasStarted: false })
  })

  it('points at the first unfinished lesson, even when a later one is done', () => {
    expect(courseProgress(LESSONS, [1, 3])).toEqual({ nextLesson: LESSONS[1], hasStarted: true })
  })

  it('has no next lesson once every lesson is done', () => {
    expect(courseProgress(LESSONS, [3, 1, 2])).toEqual({ nextLesson: undefined, hasStarted: true })
  })
})

describe('lessonStatuses', () => {
  it('marks finished lessons and the one up next', () => {
    expect(lessonStatuses(LESSONS, [1, 3]).map(({ isCompleted, isCurrent }) => ({ isCompleted, isCurrent }))).toEqual([
      { isCompleted: true, isCurrent: false },
      { isCompleted: false, isCurrent: true },
      { isCompleted: true, isCurrent: false },
    ])
  })

  it('marks no lesson as up next once every lesson is done', () => {
    expect(lessonStatuses(LESSONS, [1, 2, 3]).some((status) => status.isCurrent)).toBe(false)
  })
})
