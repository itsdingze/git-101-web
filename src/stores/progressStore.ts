import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProgressState, ProgressStore } from '@/types'

const initialState: ProgressState = {
  completedLessons: [],
  completedSteps: {},
  currentStep: {},
}

const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState,

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
    }),
    {
      name: 'git-101-progress',
      version: 5,
      migrate: (): ProgressState => ({ ...initialState }),
    }
  )
)

export default useProgressStore
