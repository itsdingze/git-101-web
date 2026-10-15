import { describe, expect, it } from 'vitest'
import type { QuizStep } from '@/types'
import { lessons } from '@/data/lessons'

const quizzes = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is QuizStep => step.type === 'quiz')
    .map((step) => ({ lessonId: lesson.id, step })),
)

describe('every quiz', () => {
  it.each(quizzes)('does not give away its answer by length in lesson $lessonId ($step.id)', ({ step }) => {
    const lengths = step.options.map((option) => option.text.length)
    const correct = lengths[step.correctIndex] ?? 0
    const longestDistractor = Math.max(...lengths.filter((_, index) => index !== step.correctIndex))

    expect(longestDistractor).toBeGreaterThanOrEqual(correct)
  })
})
