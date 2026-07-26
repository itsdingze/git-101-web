export type ProgressState = {
  completedLessons: number[]
  completedSteps: Record<string, boolean>
  currentStep: Record<number, number>
}

export type ProgressActions = {
  completeStep: (lessonId: number, stepId: string) => void
  isStepCompleted: (lessonId: number, stepId: string) => boolean
  setCurrentStep: (lessonId: number, stepIndex: number) => void
  getCurrentStep: (lessonId: number) => number
  completeLesson: (lessonId: number) => void
  isLessonCompleted: (lessonId: number) => boolean
}

export type ProgressStore = ProgressState & ProgressActions
