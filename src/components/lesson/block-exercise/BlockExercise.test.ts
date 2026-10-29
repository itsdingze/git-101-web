// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { BlockExerciseStep } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { useProgressStore } from '@/stores/progressStore'
import { messages } from '@/messages/en'
import { BlockExercise } from './BlockExercise'

vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

const STEP: BlockExerciseStep = {
  type: 'block-exercise',
  id: 'stage-file',
  prompt: 'Stage the file',
  availableBlocks: ['git', 'add', 'notes.txt'],
  correctAnswer: ['git', 'add', 'notes.txt'],
  hints: ['Start with git.'],
}

function renderExercise() {
  return render(createElement(LessonNavProvider, null, createElement(BlockExercise, { step: STEP, lessonId: 4 })))
}

function glossaryTiles(): HTMLElement[] {
  return screen.queryAllByRole('button', { name: /^Add .+ to answer$/ })
}

function answerTiles(): HTMLElement[] {
  return screen.queryAllByRole('button', { name: /from your answer$/ })
}

function activate(tile: HTMLElement | undefined) {
  if (!tile) throw new Error('No tile to activate')
  tile.focus()
  fireEvent.click(tile)
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({ completedSteps: {} })
})

afterEach(cleanup)

describe('BlockExercise', () => {
  it('announces a hint in a polite live region that was already on the page', () => {
    renderExercise()
    const regions = [...document.querySelectorAll('[aria-live="polite"]')]

    fireEvent.click(screen.getByRole('button', { name: messages.exercise.showHint }))

    expect(regions.some((region) => region.textContent?.includes('Start with git.'))).toBe(true)
  })

  it('moves focus to the next tile after adding the focused tile to the answer', () => {
    renderExercise()
    const [first, second] = glossaryTiles()

    activate(first)

    expect(document.activeElement).toBe(second)
  })

  it('moves focus to the previous tile after adding the last tile in the row', () => {
    renderExercise()
    const [, second, third] = glossaryTiles()

    activate(third)

    expect(document.activeElement).toBe(second)
  })

  it('moves focus to the answer once every tile is in it', () => {
    renderExercise()

    for (let tile = glossaryTiles()[0]; tile; tile = glossaryTiles()[0]) activate(tile)

    expect(document.activeElement).toBe(screen.getByRole('group', { name: messages.blocks.answerArea }))
  })

  it('keeps focus on an answer tile once the exercise is solved, since nothing is removed', () => {
    useProgressStore.setState({ completedSteps: { [`4:${STEP.id}`]: true } })
    renderExercise()
    const tile = screen.getByRole('button', { name: messages.blocks.remove('git') })

    activate(tile)

    expect(document.activeElement).toBe(tile)
  })

  it('moves focus along the answer as focused tiles are removed, then to the answer itself', () => {
    renderExercise()
    for (let tile = glossaryTiles()[0]; tile; tile = glossaryTiles()[0]) activate(tile)
    const [first, second, third] = answerTiles()

    activate(first)
    expect(document.activeElement).toBe(second)

    activate(third)
    expect(document.activeElement).toBe(second)

    activate(second)
    expect(document.activeElement).toBe(screen.getByRole('group', { name: messages.blocks.answerArea }))
  })
})
