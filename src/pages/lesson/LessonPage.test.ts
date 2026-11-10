// @vitest-environment jsdom
import { createElement } from 'react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Lesson, Step } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useProgressStore } from '@/stores/progressStore'
import { LessonPage } from './LessonPage'

vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

function lesson(id: number, titles: string[]): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    description: 'D',
    unlocks: [],
    steps: titles.map((title): Step => ({ type: 'reading', id: title, title, content: [] })),
  }
}

const LESSONS: Record<number, Lesson> = {
  7: lesson(7, ['Seven one', 'Seven two', 'Seven three']),
  8: lesson(8, ['Eight one', 'Eight two']),
}

vi.mock('@/data/lessons/index', () => ({
  lessonById: (id: number) => LESSONS[id],
}))

function openLesson(path: string) {
  const router = createMemoryRouter([{ path: '/lesson/:lessonId', Component: LessonPage }], { initialEntries: [path] })
  render(createElement(LessonNavProvider, null, createElement(RouterProvider, { router })))
  return router
}

beforeEach(() => {
  localStorage.clear()
  window.scrollTo = () => {}
  useProgressStore.setState({ completedLessons: [], completedSteps: {}, currentStep: {} })
})

afterEach(cleanup)

describe('LessonPage', () => {
  it('starts each lesson from its own saved step when moving straight between lessons', async () => {
    useProgressStore.setState({ currentStep: { 7: 2 } })
    const router = openLesson('/lesson/7')
    await screen.findByRole('heading', { name: 'Seven three' })

    await act(() => router.navigate('/lesson/8'))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Eight one' })).toBeTruthy())
  })

  it('moves focus to the heading of the step on screen', async () => {
    openLesson('/lesson/7')

    const heading = await screen.findByRole('heading', { name: 'Seven one' })

    expect(document.activeElement).toBe(heading)
  })
})
