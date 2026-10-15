// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'git-101-progress'

const savedProgress = {
  completedLessons: [8],
  completedSteps: { '8:when-to-stash': true },
  currentStep: { 8: 3 },
  identity: null,
}

async function loadStoreSavedAt(version: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: savedProgress, version }))
  vi.resetModules()
  const { useProgressStore } = await import('./progressStore')
  return useProgressStore.getState()
}

afterEach(() => {
  localStorage.clear()
})

describe('progress store', () => {
  it('forgets progress saved by the course before the Markdown rebuild', async () => {
    const state = await loadStoreSavedAt(5)

    expect(state.completedLessons).toEqual([])
    expect(state.completedSteps).toEqual({})
    expect(state.currentStep).toEqual({})
  })

  it('keeps progress saved by the current course', async () => {
    const state = await loadStoreSavedAt(6)

    expect(state.completedLessons).toEqual([8])
    expect(state.completedSteps).toEqual({ '8:when-to-stash': true })
    expect(state.currentStep).toEqual({ 8: 3 })
  })
})
