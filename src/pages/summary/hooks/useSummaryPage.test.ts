// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useProgressStore } from '@/stores/progressStore'
import { lessonById } from '@/data/lessons/index'
import { useSummaryPage } from './useSummaryPage'

function SummaryRoute({ children, lessonId }: { children: ReactNode; lessonId: number }) {
  return createElement(
    MemoryRouter,
    { initialEntries: [`/lesson/${lessonId}/summary`] },
    createElement(Routes, null, createElement(Route, { path: '/lesson/:lessonId/summary', element: children })),
  )
}

describe('summary navigation', () => {
  it.each([
    { lessonId: 7, nextId: 8 },
    { lessonId: 10, nextId: 11 },
    { lessonId: 11, nextId: 12 },
    { lessonId: 12, nextId: undefined },
  ])('follows course order from lesson $lessonId to $nextId', ({ lessonId, nextId }) => {
    const { result } = renderHook(useSummaryPage, {
      wrapper: ({ children }) => createElement(SummaryRoute, { lessonId, children }),
    })

    expect(result.current.nextLesson?.id).toBe(nextId)
  })
})

describe('summary of a lesson', () => {
  function renderSummary(lessonId: number) {
    return renderHook(useSummaryPage, {
      wrapper: ({ children }) => createElement(SummaryRoute, { lessonId, children }),
    })
  }

  it('is not finished when opened by link before the steps are done', () => {
    useProgressStore.setState({ completedLessons: [], completedSteps: {} })

    expect(renderSummary(3).result.current.lessonFinished).toBe(false)
  })

  it('is finished once every step is done', () => {
    const steps = lessonById(3)?.steps ?? []
    useProgressStore.setState({
      completedLessons: [],
      completedSteps: Object.fromEntries(steps.map((step) => [`3:${step.id}`, true])),
    })

    expect(renderSummary(3).result.current.lessonFinished).toBe(true)
  })
})
