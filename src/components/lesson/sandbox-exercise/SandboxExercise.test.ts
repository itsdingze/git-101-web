// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { SandboxExerciseStep } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useProgressStore } from '@/stores/progressStore'
import { SandboxExercise } from './SandboxExercise'

const STEP: SandboxExerciseStep = {
  type: 'sandbox-exercise',
  id: 'practice',
  title: 'Practice',
  brief: 'Make your first repository.',
  mode: 'guided',
  seed: { dir: 'todo-app' },
  goals: [{ id: 'init', label: 'Run git init', hints: ['Run `git init`.'], check: { kind: 'repo-initialized' } }],
}

const RETURNING_NOTE = /You've completed this exercise/

function exercise() {
  return createElement(LessonNavProvider, null, createElement(SandboxExercise, { step: STEP, lessonId: 1 }))
}

function renderExercise(): string {
  return renderToStaticMarkup(exercise())
}

async function openExercise(): Promise<void> {
  render(exercise())
  await screen.findByLabelText(/Terminal command input/, {}, { timeout: 4_000 })
}

beforeAll(() => {
  Element.prototype.scrollTo = () => undefined
})

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('SandboxExercise', () => {
  it('shows the brief while the practice terminal starts up', () => {
    const markup = renderExercise()

    expect(markup).toContain('Make your first repository.')
    expect(markup).toContain('Setting up the practice terminal')
    expect(markup).not.toContain('<input')
  })

  it('offers a hint and Start over while the exercise is unfinished', () => {
    const markup = renderExercise()

    expect(markup).toContain('Show hint')
    expect(markup).toContain('Start over')
  })

  it('tells a returning learner they finished this exercise before', async () => {
    useProgressStore.setState({ completedSteps: { '1:practice': true } })

    await openExercise()

    expect(screen.getByText(RETURNING_NOTE)).toBeDefined()
  })

  it('says nothing about a previous finish on a first visit', async () => {
    await openExercise()

    expect(screen.queryByText(RETURNING_NOTE)).toBeNull()
  })
})
