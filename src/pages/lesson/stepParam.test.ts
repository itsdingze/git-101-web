import { describe, expect, it } from 'vitest'
import type { Lesson, Step } from '@/types'
import { furthestReachableStep, resolveStepIndex, stepParamValue } from './stepParam'

const lesson: Lesson = {
  id: 2,
  title: 'Lesson',
  description: 'D',
  unlocks: [],
  steps: ['a', 'b', 'c', 'd'].map((id): Step => ({ type: 'reading', id, content: [] })),
}

function completed(...stepIds: string[]) {
  return (stepId: string) => stepIds.includes(stepId)
}

describe('furthestReachableStep', () => {
  it('stops at the first step the learner has not completed', () => {
    expect(furthestReachableStep(lesson, { lessonCompleted: false, savedStep: 0, isStepCompleted: completed('a', 'b') })).toBe(2)
  })

  it('reaches the saved step even when older progress has gaps', () => {
    expect(furthestReachableStep(lesson, { lessonCompleted: false, savedStep: 3, isStepCompleted: completed() })).toBe(3)
  })

  it('reaches every step of a finished lesson', () => {
    expect(furthestReachableStep(lesson, { lessonCompleted: true, savedStep: 0, isStepCompleted: completed() })).toBe(3)
  })

  it('stays on the last step when every step is completed', () => {
    expect(
      furthestReachableStep(lesson, { lessonCompleted: false, savedStep: 0, isStepCompleted: completed('a', 'b', 'c', 'd') }),
    ).toBe(3)
  })

  it('reaches only the start of a lesson that does not exist', () => {
    expect(furthestReachableStep(undefined, { lessonCompleted: false, savedStep: 3, isStepCompleted: completed() })).toBe(0)
  })
})

describe('resolveStepIndex', () => {
  const entryStep = 1
  const furthest = 2

  it('uses the entry step when the address names no step', () => {
    expect(resolveStepIndex(null, entryStep, furthest)).toBe(1)
  })

  it('reads the address as a step number counted from one', () => {
    expect(resolveStepIndex('3', entryStep, furthest)).toBe(2)
    expect(resolveStepIndex('1', entryStep, furthest)).toBe(0)
  })

  it('stops at the furthest reachable step when the address asks for more', () => {
    expect(resolveStepIndex('4', entryStep, furthest)).toBe(2)
    expect(resolveStepIndex('999', entryStep, furthest)).toBe(2)
  })

  it.each(['abc', '', '0', '-1', '1.5', '2x', ' 2'])('goes to the furthest reachable step for the malformed value %j', (value) => {
    expect(resolveStepIndex(value, entryStep, furthest)).toBe(2)
  })
})

describe('stepParamValue', () => {
  it('writes a step index as the number the learner sees', () => {
    expect(stepParamValue(0)).toBe('1')
    expect(stepParamValue(4)).toBe('5')
  })
})
