// @vitest-environment jsdom
import { createElement, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { QuizStep as QuizStepType } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useLessonNav } from '@/contexts/lesson-nav/useLessonNav'
import { useProgressStore } from '@/stores/progressStore'
import { messages } from '@/messages/en'
import { QuizStep } from './QuizStep'

const STEP: QuizStepType = {
  type: 'quiz',
  id: 'pick',
  question: 'Which command starts a repository?',
  options: [{ text: 'git init' }, { text: 'git add', whyWrong: 'That stages files.' }],
  correctIndex: 0,
  explanation: 'git init creates the repository.',
}

let triggerCheck = () => {}

function CheckProbe() {
  const { triggerCheck: latestTrigger } = useLessonNav()

  useEffect(() => {
    triggerCheck = latestTrigger
  })

  return null
}

function openQuiz() {
  render(
    createElement(
      LessonNavProvider,
      null,
      createElement(QuizStep, { step: STEP, lessonId: 4 }),
      createElement(CheckProbe),
    ),
  )
}

function pick(text: string) {
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(text) }))
  act(() => triggerCheck())
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('QuizStep', () => {
  it('says the answer is incorrect in words, on the feedback and the option', () => {
    openQuiz()

    pick('git add')

    expect(screen.getByRole('status').textContent).toContain(messages.feedback.wrong)
    expect(screen.getByRole('status').textContent).toContain('That stages files.')
    expect(screen.getByRole('radio', { name: /git add/ }).textContent).toContain(messages.quiz.optionWrong)
  })

  it('says the answer is correct in words, on the feedback and the option', () => {
    openQuiz()

    pick('git init')

    expect(screen.getByRole('status').textContent).toContain(messages.feedback.right)
    expect(screen.getByRole('radio', { name: /git init/ }).textContent).toContain(messages.quiz.optionCorrect)
  })

  it('adds no verdict to an option before it is checked', () => {
    openQuiz()

    fireEvent.click(screen.getByRole('radio', { name: /git add/ }))

    expect(screen.getByRole('radio', { name: /git add/ }).textContent).toBe('git add')
  })
})
