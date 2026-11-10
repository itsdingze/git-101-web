import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ProgressStore } from './progress'
import { EMPTY_PROGRESS, mergeProgress, parseProgress } from './progressStoreState'

const STORAGE_KEY = 'git-101-progress'
const OLDEST_MIGRATABLE_VERSION = 6

const tolerantLocalStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      return
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,

      completeStep: (lessonId, stepId) => {
        const state = get()
        const key = `${lessonId}:${stepId}`
        if (state.completedSteps[key]) return

        set((state) => ({
          completedSteps: { ...state.completedSteps, [key]: true },
        }))
      },

      isStepCompleted: (lessonId, stepId) => {
        return !!get().completedSteps[`${lessonId}:${stepId}`]
      },

      setCurrentStep: (lessonId, stepIndex) => {
        set((state) => ({
          currentStep: { ...state.currentStep, [lessonId]: stepIndex },
        }))
      },

      getCurrentStep: (lessonId) => {
        return get().currentStep[lessonId] || 0
      },

      completeLesson: (lessonId) => {
        const state = get()
        if (state.completedLessons.includes(lessonId)) return

        set((state) => ({
          completedLessons: [...state.completedLessons, lessonId],
        }))
      },

      isLessonCompleted: (lessonId) => {
        return get().completedLessons.includes(lessonId)
      },

      setIdentity: (identity) => {
        set({ identity })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => tolerantLocalStorage),
      version: 6,
      migrate: (saved, version) => (version < OLDEST_MIGRATABLE_VERSION ? EMPTY_PROGRESS : parseProgress(saved)),
      merge: mergeProgress,
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) void useProgressStore.persist.rehydrate()
  })
}
