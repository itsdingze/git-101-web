import type { BlockExerciseStep } from '@/types'
import { messages } from '@/messages/en'

type Answers = Pick<BlockExerciseStep, 'correctAnswer' | 'acceptableAnswers' | 'decoyReasons' | 'missingReasons'>

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((piece, index) => piece === b[index])
}

function distance(answer: readonly string[], candidate: readonly string[]): number {
  const extras = answer.filter((piece) => !candidate.includes(piece)).length
  const missing = candidate.filter((piece) => !answer.includes(piece)).length
  return extras + missing
}

function closestCandidate(answer: readonly string[], candidates: readonly (readonly string[])[]): readonly string[] {
  return candidates.reduce((best, candidate) =>
    distance(answer, candidate) < distance(answer, best) ? candidate : best,
  )
}

function missingMessage(candidate: readonly string[], missingIndex: number): string {
  if (missingIndex === 0) return messages.blocks.missingFirst
  if (missingIndex === candidate.length - 1) return messages.blocks.missingLast
  return messages.blocks.missingBetween(candidate[missingIndex - 1] ?? '', candidate[missingIndex + 1] ?? '')
}

export function blockFeedback(answer: readonly string[], answers: Answers): string | null {
  const candidates = [answers.correctAnswer, ...(answers.acceptableAnswers ?? [])]
  if (candidates.some((candidate) => sameOrder(answer, candidate))) return null

  const candidate = closestCandidate(answer, candidates)

  const extras = answer.filter((piece) => !candidate.includes(piece))
  const explained = extras.find((piece) => answers.decoyReasons?.[piece] !== undefined)
  if (explained !== undefined) return answers.decoyReasons?.[explained] ?? null
  if (extras[0] !== undefined) return messages.blocks.doesNotBelong(extras[0])

  const missingIndex = candidate.findIndex((piece) => !answer.includes(piece))
  if (missingIndex !== -1) {
    return answers.missingReasons?.[candidate[missingIndex] ?? ''] ?? missingMessage(candidate, missingIndex)
  }

  return messages.blocks.wrongOrder
}
