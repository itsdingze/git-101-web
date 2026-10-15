import { describe, expect, it } from 'vitest'
import type { BlockExerciseStep } from '@/types'
import { lessons } from '@/data/lessons'

const exercises = lessons.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is BlockExerciseStep => step.type === 'block-exercise')
    .map((step) => ({ lessonId: lesson.id, step })),
)

function tilesThatCanBeWrong(step: BlockExerciseStep): string[] {
  const answers = [step.correctAnswer, ...(step.acceptableAnswers ?? [])]
  return step.availableBlocks.filter((block) => !answers.every((answer) => answer.includes(block)))
}

describe('every block exercise', () => {
  it.each(exercises)('explains every tile that is not in all its answers, lesson $lessonId ($step.id)', ({ step }) => {
    const unexplained = tilesThatCanBeWrong(step).filter((block) => !step.decoyReasons?.[block])
    expect(unexplained).toEqual([])
  })
})
