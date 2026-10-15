// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { BlockExerciseStep } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { useProgressStore } from '@/stores/progressStore'
import { useBlockAnswer } from './useBlockAnswer'

const STEP: BlockExerciseStep = {
  type: 'block-exercise',
  id: 'stage-file',
  prompt: 'Stage the file',
  availableBlocks: ['git', 'add', 'notes.txt', 'commit'],
  correctAnswer: ['git', 'add', 'notes.txt'],
  hints: ['Start with `git`.', 'Then `add`.'],
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(LessonNavProvider, null, children)
}

function renderAnswer() {
  return renderHook(() => ({ answer: useBlockAnswer(STEP, 4), nav: useLessonNav() }), { wrapper })
}

function build(result: { current: ReturnType<typeof renderAnswer>['result']['current'] }, blocks: readonly string[]) {
  for (const block of blocks) act(() => result.current.answer.add(block))
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('useBlockAnswer', () => {
  it('explains a wrong answer and shakes, then drops the explanation once the answer changes', () => {
    const { result } = renderAnswer()
    build(result, ['git', 'commit'])

    act(() => result.current.nav.triggerCheck())

    expect(result.current.answer.feedback).not.toBeNull()
    expect(result.current.answer.shaking).toBe(true)

    act(() => result.current.answer.remove('commit'))

    expect(result.current.answer.feedback).toBeNull()
  })

  it('records the step once the answer is right, then ignores further edits', () => {
    const { result } = renderAnswer()
    build(result, STEP.correctAnswer)

    act(() => result.current.nav.triggerCheck())
    act(() => result.current.answer.remove('git'))

    expect(result.current.answer.solved).toBe(true)
    expect(result.current.answer.answer).toEqual(STEP.correctAnswer)
    expect(useProgressStore.getState().isStepCompleted(4, STEP.id)).toBe(true)
  })

  it('shows the next hint after a wrong check while hints are open', () => {
    const { result } = renderAnswer()
    act(() => result.current.answer.toggleHint())
    expect(result.current.answer.visibleHint).toBe('Start with `git`.')

    build(result, ['commit'])
    act(() => result.current.nav.triggerCheck())

    expect(result.current.answer.visibleHint).toBe('Then `add`.')
  })

  it('starts over with an empty answer and hints closed', () => {
    const { result } = renderAnswer()
    act(() => result.current.answer.toggleHint())
    build(result, ['commit'])
    act(() => result.current.nav.triggerCheck())

    act(() => result.current.answer.reset())

    expect(result.current.answer).toMatchObject({ answer: [], feedback: null, shaking: false, visibleHint: null })
  })
})
