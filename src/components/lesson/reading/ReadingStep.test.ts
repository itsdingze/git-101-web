// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReadingStep as ReadingStepType } from '@/types'
import { LessonNavProvider } from '@/contexts/lesson-nav/LessonNavProvider'
import { messages } from '@/messages/en'
import { ReadingStep } from './ReadingStep'

vi.mock('@/components/lesson/reading/visualization/ThreePlaceModel', () => ({
  ThreePlaceModel: () => {
    throw new Error('diagram broke')
  },
}))

const STEP: ReadingStepType = {
  type: 'reading',
  id: 'three-places',
  title: 'Three places',
  content: [{ type: 'text', value: 'Git keeps your work in three places.' }],
  visualization: {
    kind: 'three-place-model',
    files: ['notes.txt'],
    ignored: [],
    stageFirst: 'notes.txt',
    commitMessage: 'Add notes',
  },
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ReadingStep', () => {
  it('keeps the lesson text when its diagram fails, and says the diagram did not load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(createElement(LessonNavProvider, null, createElement(ReadingStep, { step: STEP })))

    expect(await screen.findByText(messages.reading.diagramFailed)).toBeTruthy()
    expect(screen.getByText('Git keeps your work in three places.')).toBeTruthy()
  })

  it('moves focus to the diagram when the learner jumps to it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    Element.prototype.scrollIntoView = () => {}
    render(createElement(LessonNavProvider, null, createElement(ReadingStep, { step: STEP })))
    await screen.findByText(messages.reading.diagramFailed)

    fireEvent.click(screen.getByRole('button', { name: messages.reading.showDiagram }))

    expect(document.activeElement).toBe(screen.getByRole('group', { name: messages.reading.diagram }))
  })
})
