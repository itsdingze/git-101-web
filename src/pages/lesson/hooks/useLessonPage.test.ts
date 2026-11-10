// @vitest-environment jsdom
import { type ComponentType, createElement, useEffect } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Lesson, Step } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import type { LessonNavContextValue } from '@/contexts/lesson-nav/lessonNav'
import { useProgressStore } from '@/stores/progressStore'
import { useLessonPage } from './useLessonPage'

const LESSON: Lesson = {
  id: 7,
  title: 'Lesson',
  description: 'D',
  unlocks: [],
  steps: ['a', 'b', 'c'].map((id): Step => ({ type: 'reading', id, content: [] })),
}

vi.mock('@/data/lessons/index', () => ({
  lessonById: (id: number) => (id === 7 ? LESSON : undefined),
}))

let shownStep = -1
let nav: LessonNavContextValue | null = null

function Probe() {
  const { lessonId } = useParams()
  const { currentStepIndex } = useLessonPage(lessonId)
  const latestNav = useLessonNav()

  useEffect(() => {
    shownStep = currentStepIndex
    nav = latestNav
  })

  return null
}

function ExerciseProbe() {
  const { lockContinue } = useLessonNav()

  useEffect(() => {
    lockContinue(true)
  }, [lockContinue])

  return createElement(Probe)
}

function openAt(path: string, Page: ComponentType = Probe) {
  const router = createMemoryRouter(
    [
      { path: '/lesson/:lessonId', Component: Page },
      { path: '/lesson/:lessonId/summary', Component: () => null },
    ],
    { initialEntries: [path] },
  )
  render(createElement(LessonNavProvider, null, createElement(RouterProvider, { router })))
  return router
}

function pressContinue() {
  act(() => nav?.onNext?.())
}

async function waitForStep(step: number) {
  await waitFor(() => expect(shownStep).toBe(step))
}

function settle() {
  act(() => {
    vi.advanceTimersByTime(1000)
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['performance'] })
  useProgressStore.setState({ completedLessons: [], completedSteps: {}, currentStep: {} })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useLessonPage step address', () => {
  it('resumes at the saved step when the address names no step', async () => {
    useProgressStore.setState({ currentStep: { 7: 1 }, completedSteps: { '7:a': true } })

    openAt('/lesson/7')

    await waitForStep(1)
  })

  it('writes the step it opens with into the address, so browser Back after a refresh returns to it', async () => {
    useProgressStore.setState({ currentStep: { 7: 1 }, completedSteps: { '7:a': true } })

    const router = openAt('/lesson/7')

    await waitFor(() => expect(router.state.location.search).toBe('?step=2'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('keeps what the exercise told the footer when the address is rewritten', async () => {
    const router = openAt('/lesson/7', ExerciseProbe)

    await waitFor(() => expect(router.state.location.search).toBe('?step=1'))
    await waitFor(() => expect(nav?.onNext).not.toBeNull())

    expect(nav?.continueLocked).toBe(true)
  })

  it('opens the step the address names, so a refresh stays on it', async () => {
    useProgressStore.setState({ completedSteps: { '7:a': true, '7:b': true } })

    openAt('/lesson/7?step=2')

    await waitForStep(1)
  })

  it('adds a history entry per step, so browser Back returns to the previous step', async () => {
    const router = openAt('/lesson/7')
    await waitForStep(0)

    pressContinue()
    await waitForStep(1)
    expect(router.state.location.search).toBe('?step=2')
    expect(useProgressStore.getState().isStepCompleted(7, 'a')).toBe(true)

    await act(() => router.navigate(-1))
    await waitForStep(0)
  })

  it('remembers where browser Back left the learner', async () => {
    useProgressStore.setState({ completedSteps: { '7:a': true, '7:b': true } })
    const router = openAt('/lesson/7?step=3')
    await waitForStep(2)
    await act(() => router.navigate('/lesson/7?step=1'))
    await waitForStep(0)

    expect(useProgressStore.getState().getCurrentStep(7)).toBe(0)
  })

  it('clamps a step past the learner’s progress to the furthest reachable one, and rewrites the address', async () => {
    useProgressStore.setState({ completedSteps: { '7:a': true } })

    const router = openAt('/lesson/7?step=99')

    await waitForStep(1)
    await waitFor(() => expect(router.state.location.search).toBe('?step=2'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('treats a malformed step like one past the furthest reachable step instead of showing not found', async () => {
    openAt('/lesson/7?step=banana')

    await waitForStep(0)
    expect(nav?.total).toBe(3)
  })

  it('goes to the lesson summary after the last step', async () => {
    useProgressStore.setState({ completedSteps: { '7:a': true, '7:b': true } })
    const router = openAt('/lesson/7?step=3')
    await waitForStep(2)

    pressContinue()

    await waitFor(() => expect(router.state.location.pathname).toBe('/lesson/7/summary'))
  })
})

describe('useLessonPage footer activations', () => {
  it('ignores a second Continue pressed right after the first', async () => {
    openAt('/lesson/7')
    await waitForStep(0)

    act(() => {
      nav?.onNext?.()
      nav?.onNext?.()
    })
    await waitForStep(1)
    pressContinue()

    expect(shownStep).toBe(1)
    expect(useProgressStore.getState().isStepCompleted(7, 'b')).toBe(false)
  })

  it('accepts Continue again once the new step has settled', async () => {
    openAt('/lesson/7')
    await waitForStep(0)
    pressContinue()
    await waitForStep(1)

    settle()
    pressContinue()

    await waitForStep(2)
  })

  it('ignores a Continue that arrives right after Check turned the button into Continue', async () => {
    openAt('/lesson/7')
    await waitForStep(0)
    act(() => nav?.registerCheck(() => true))
    settle()

    act(() => nav?.triggerCheck())
    await waitFor(() => expect(nav?.checkResult).toBe('correct'))
    pressContinue()

    expect(shownStep).toBe(0)
  })
})
