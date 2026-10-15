// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useExerciseNav } from './useExerciseNav'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'

type Options = Parameters<typeof useExerciseNav>[0]

function wrapper({ children }: { children: ReactNode }) {
  return createElement(LessonNavProvider, null, children)
}

function renderExerciseNav(initialProps: Options) {
  return renderHook(
    (options: Options) => {
      useExerciseNav(options)
      return useLessonNav()
    },
    { wrapper, initialProps },
  )
}

const wrongAnswer = () => false

afterEach(cleanup)

describe('useExerciseNav', () => {
  it('keeps a wrong answer on screen when the exercise holds incorrect results', () => {
    const { result } = renderExerciseNav({ solved: false, checkFn: wrongAnswer, holdIncorrect: true, answerKey: 'a' })

    act(() => result.current.triggerCheck())

    expect(result.current.checkResult).toBe('incorrect')
  })

  it('lets a wrong answer pass silently when the exercise does not hold incorrect results', () => {
    const { result } = renderExerciseNav({ solved: false, checkFn: wrongAnswer })

    act(() => result.current.triggerCheck())

    expect(result.current.checkResult).toBeNull()
  })

  it('clears a held wrong answer once the learner changes it', () => {
    const { result, rerender } = renderExerciseNav({
      solved: false,
      checkFn: wrongAnswer,
      holdIncorrect: true,
      answerKey: 'a',
    })
    act(() => result.current.triggerCheck())

    rerender({ solved: false, checkFn: wrongAnswer, holdIncorrect: true, answerKey: 'b' })

    expect(result.current.checkResult).toBeNull()
  })

  it('keeps a correct result once the step is solved, even as the answer changes', () => {
    const { result, rerender } = renderExerciseNav({
      solved: false,
      checkFn: () => true,
      holdIncorrect: true,
      answerKey: 'a',
    })
    act(() => result.current.triggerCheck())
    rerender({ solved: true, checkFn: () => true, holdIncorrect: true, answerKey: 'a' })

    rerender({ solved: true, checkFn: () => true, holdIncorrect: true, answerKey: 'b' })

    expect(result.current.checkResult).toBe('correct')
    expect(result.current.stepCompleted).toBe(true)
  })

  it('checks the latest answer, not the one from the first render', () => {
    const { result, rerender } = renderExerciseNav({ solved: false, checkFn: wrongAnswer, holdIncorrect: true })

    rerender({ solved: false, checkFn: () => true, holdIncorrect: true })
    act(() => result.current.triggerCheck())

    expect(result.current.checkResult).toBe('correct')
  })

  it('reports the step solved and stops checking once it is', () => {
    const { result, rerender } = renderExerciseNav({ solved: false, checkFn: () => true })
    expect(result.current.stepCompleted).toBe(false)

    rerender({ solved: true, checkFn: () => true })
    act(() => result.current.triggerCheck())

    expect(result.current.stepCompleted).toBe(true)
    expect(result.current.checkResult).toBeNull()
  })
})
