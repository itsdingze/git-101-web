import type { BlockExerciseStep } from '@/types'
import { seededShuffle } from '@/components/lesson/model/seededShuffle'

function startsWithAnswer(tiles: readonly string[], answer: readonly string[]): boolean {
  return answer.every((block, index) => tiles[index] === block)
}

export function tileOrder(step: Pick<BlockExerciseStep, 'id' | 'availableBlocks' | 'correctAnswer'>): string[] {
  const shuffled = seededShuffle(step.availableBlocks, step.id)
  if (!startsWithAnswer(shuffled, step.correctAnswer)) return shuffled

  const [first, ...rest] = shuffled
  return first === undefined ? shuffled : [...rest, first]
}
