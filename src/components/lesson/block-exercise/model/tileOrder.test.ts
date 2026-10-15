import { describe, expect, it } from 'vitest'
import type { BlockExerciseStep } from '@/types'
import { lessons } from '@/data/lessons'
import { tileOrder } from './tileOrder'

const exercises = lessons.flatMap((lesson) =>
  lesson.steps.filter((step): step is BlockExerciseStep => step.type === 'block-exercise'),
)

describe('tileOrder', () => {
  it.each(exercises)('never lays the answer out in order at the front for $id', (step) => {
    const tiles = tileOrder(step)

    expect([...tiles].sort()).toEqual([...step.availableBlocks].sort())
    expect(tiles.slice(0, step.correctAnswer.length)).not.toEqual(step.correctAnswer)
  })

  it('gives the same order every time for the same exercise', () => {
    const [first] = exercises
    if (!first) throw new Error('no block exercises')

    expect(tileOrder(first)).toEqual(tileOrder(first))
  })
})
