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
  vi.restoreAllMocks()
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

  it('keeps the learner moving when the browser refuses to save progress', async () => {
    const state = await loadStoreSavedAt(6)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })

    expect(() => state.completeStep(8, 'next-step')).not.toThrow()
    expect(state.isStepCompleted(8, 'next-step')).toBe(true)
  })

  it('keeps progress saved by a newer version of the course after a rollback', async () => {
    const state = await loadStoreSavedAt(7)

    expect(state.completedLessons).toEqual([8])
    expect(state.completedSteps).toEqual({ '8:when-to-stash': true })
  })

  it('falls back to no progress for each saved value with the wrong shape', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { completedLessons: null, completedSteps: 'done', currentStep: { 3: -2, 4: 'x', 5: 1 }, identity: 7 },
        version: 6,
      }),
    )
    vi.resetModules()
    const { useProgressStore } = await import('./progressStore')
    const state = useProgressStore.getState()

    expect(state.isLessonCompleted(1)).toBe(false)
    expect(state.isStepCompleted(1, 'a')).toBe(false)
    expect(state.getCurrentStep(3)).toBe(0)
    expect(state.getCurrentStep(4)).toBe(0)
    expect(state.getCurrentStep(5)).toBe(1)
    expect(state.identity).toBeNull()
  })

  it('combines progress made in another tab instead of losing either side', async () => {
    const state = await loadStoreSavedAt(6)
    const { useProgressStore } = await import('./progressStore')
    state.completeStep(1, 'this-tab')
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { completedLessons: [2], completedSteps: { '2:other-tab': true }, currentStep: { 2: 1 }, identity: null },
        version: 6,
      }),
    )

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))

    const after = useProgressStore.getState()
    expect(after.isStepCompleted(1, 'this-tab')).toBe(true)
    expect(after.isStepCompleted(2, 'other-tab')).toBe(true)
    expect(after.isLessonCompleted(8)).toBe(true)
    expect(after.isLessonCompleted(2)).toBe(true)
  })

  it('ignores storage events for other keys', async () => {
    const state = await loadStoreSavedAt(6)
    const { useProgressStore } = await import('./progressStore')
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { ...savedProgress, completedLessons: [2] }, version: 6 }),
    )

    window.dispatchEvent(new StorageEvent('storage', { key: 'git-101-theme' }))

    expect(state.isLessonCompleted(2)).toBe(false)
    expect(useProgressStore.getState().isLessonCompleted(2)).toBe(false)
  })
})
