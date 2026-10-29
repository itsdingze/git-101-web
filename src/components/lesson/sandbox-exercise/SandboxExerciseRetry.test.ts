// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SandboxExerciseStep } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { messages } from '@/messages/en'
import { SandboxExercise } from './SandboxExercise'

vi.mock('@/lib/git-sim/createSandbox', () => ({
  createSandbox: () => Promise.reject(new Error('chunk failed')),
}))

const STEP: SandboxExerciseStep = {
  type: 'sandbox-exercise',
  id: 'practice',
  title: 'Practice',
  brief: 'Make your first repository.',
  mode: 'guided',
  seed: { dir: 'todo-app' },
  goals: [{ id: 'init', label: 'Run git init', check: { kind: 'repo-initialized' } }],
}

beforeAll(() => {
  Element.prototype.scrollTo = () => undefined
})

afterEach(cleanup)

describe('SandboxExercise when setup keeps failing', () => {
  it('asks for a page reload, with focus on the reload button, after another failed attempt', async () => {
    render(createElement(LessonNavProvider, null, createElement(SandboxExercise, { step: STEP, lessonId: 1 })))
    const retry = await screen.findByRole('button', { name: messages.sandbox.retrySetup })

    retry.focus()
    await act(async () => {
      fireEvent.click(retry)
      await Promise.resolve()
    })

    const reload = await screen.findByRole('button', { name: messages.error.reload })
    expect(screen.getByRole('alert').textContent).toBe(messages.sandbox.setupFailedAgain)
    expect(screen.queryByRole('button', { name: messages.sandbox.retrySetup })).toBeNull()
    expect(document.activeElement).toBe(reload)
  })
})
