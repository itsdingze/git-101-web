// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { QuizStep } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { useProgressStore } from '@/stores/progressStore'
import { useQuizStep } from './useQuizStep'

const STEP: QuizStep = {
  type: 'quiz',
  id: 'what-stages',
  question: 'Which command stages a file?',
  options: [
    { text: '`git commit`', whyWrong: 'Committing records what is already staged.' },
    { text: '`git add`' },
    { text: '`git push`' },
  ],
  correctIndex: 1,
  explanation: '`git add` stages a file.',
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(LessonNavProvider, null, children)
}

function renderQuiz() {
  return renderHook(() => ({ quiz: useQuizStep(STEP, 2), nav: useLessonNav() }), { wrapper })
}

function slotOf(result: ReturnType<typeof renderQuiz>['result'], text: string): number {
  return result.current.quiz.slots.findIndex((slot) => slot.option.text === text)
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('useQuizStep', () => {
  it('explains a wrong pick and shakes, then clears the explanation on a new pick', () => {
    const { result } = renderQuiz()
    const wrong = slotOf(result, '`git commit`')

    act(() => result.current.quiz.select(wrong))
    act(() => result.current.nav.triggerCheck())

    expect(result.current.quiz.feedback).toBe('Committing records what is already staged.')
    expect(result.current.quiz.shaking).toBe(true)
    expect(result.current.quiz.slots[wrong]?.tone).toBe('wrong')

    act(() => result.current.quiz.select(slotOf(result, '`git push`')))

    expect(result.current.quiz.feedback).toBeNull()
  })

  it('records the step and marks the right answer once it is checked', () => {
    const { result } = renderQuiz()
    const right = slotOf(result, '`git add`')

    act(() => result.current.quiz.select(right))
    act(() => result.current.nav.triggerCheck())

    expect(result.current.quiz.completed).toBe(true)
    expect(result.current.quiz.slots[right]?.tone).toBe('correct')
    expect(useProgressStore.getState().isStepCompleted(2, STEP.id)).toBe(true)
  })

  it('moves the choice with the arrow keys, keeping one option in the tab order', () => {
    const { result } = renderQuiz()
    let prevented = false

    act(() => result.current.quiz.pressKey(0, { key: 'ArrowDown', preventDefault: () => { prevented = true } }))

    expect(prevented).toBe(true)
    expect(result.current.quiz.slots.map((slot) => slot.checked)).toEqual([false, true, false])
    expect(result.current.quiz.slots.map((slot) => slot.tabIndex)).toEqual([-1, 0, -1])
  })

  it('opens a completed quiz with the right answer chosen', () => {
    useProgressStore.setState({ completedSteps: { [`2:${STEP.id}`]: true } })

    const { result } = renderQuiz()

    expect(result.current.quiz.slots[slotOf(result, '`git add`')]).toMatchObject({ checked: true, tone: 'correct' })
  })
})
