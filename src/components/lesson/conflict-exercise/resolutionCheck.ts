import type { ConflictExerciseStep } from '@/types'
import { composeResolvedFile } from './conflictFileText'

export type ResolutionVerdict =
  | 'solved'
  | 'marker-left'
  | 'kept-both'
  | 'missing-side'
  | 'kept-ours'
  | 'kept-theirs'
  | 'near-miss'
  | 'wrong-content'

const NEAR_MISS_WORDS = 2
const TYPO_CHARACTERS = 2
const TYPO_SHARE = 0.15

const CONFLICT_MARKERS = ['<<<<<<<', '=======', '>>>>>>>']

function normalizeFile(text: string): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  return lines.join('\n')
}

function hasConflictMarker(text: string): boolean {
  return CONFLICT_MARKERS.some((marker) => text.includes(marker))
}

function nearlyEqual(line: string, wanted: string): boolean {
  const allowed = Math.max(TYPO_CHARACTERS, Math.floor(wanted.length * TYPO_SHARE))
  return editDistance([...line.trim()], [...wanted.trim()]) <= allowed
}

function sidePresent(side: string, text: string): boolean {
  if (text.includes(side.trim())) return true
  const lines = text.split('\n')
  return side
    .trim()
    .split('\n')
    .every((wanted) => lines.some((line) => nearlyEqual(line, wanted)))
}

function sidesKept(step: ConflictExerciseStep, text: string): { ours: boolean; theirs: boolean } {
  return { ours: sidePresent(step.oursContent, text), theirs: sidePresent(step.theirsContent, text) }
}

function editDistance(a: readonly string[], b: readonly string[]): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (const [i, word] of a.entries()) {
    const current = [i + 1]
    for (const [j, other] of b.entries()) {
      current.push(Math.min((previous[j + 1] ?? 0) + 1, (current[j] ?? 0) + 1, (previous[j] ?? 0) + (word === other ? 0 : 1)))
    }
    previous = current
  }
  return previous[b.length] ?? 0
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function isNearMiss(expectedFiles: readonly string[], submitted: string): boolean {
  const words = wordsOf(submitted)
  return expectedFiles.some((expected) => editDistance(wordsOf(expected), words) <= NEAR_MISS_WORDS)
}

function mismatchVerdict(step: ConflictExerciseStep, submitted: string, expectedFiles: readonly string[]): ResolutionVerdict {
  const wanted = step.acceptableResolutions.map((resolution) => sidesKept(step, resolution))
  const expectsBoth = wanted.every((kept) => kept.ours && kept.theirs)
  const expectsOurs = wanted.every((kept) => kept.ours && !kept.theirs)
  const expectsTheirs = wanted.every((kept) => kept.theirs && !kept.ours)
  const kept = sidesKept(step, submitted)

  if (!expectsBoth && kept.ours && kept.theirs) return 'kept-both'
  if (expectsBoth && kept.ours !== kept.theirs) return 'missing-side'
  if (expectsTheirs && kept.ours && !kept.theirs) return 'kept-ours'
  if (expectsOurs && kept.theirs && !kept.ours) return 'kept-theirs'
  if (isNearMiss(expectedFiles, submitted)) return 'near-miss'
  return 'wrong-content'
}

export function checkResolution(step: ConflictExerciseStep, buffer: string): ResolutionVerdict {
  if (hasConflictMarker(buffer)) return 'marker-left'

  const submitted = normalizeFile(buffer)
  const expectedFiles = step.acceptableResolutions.map((resolution) => normalizeFile(composeResolvedFile(step, resolution)))

  return expectedFiles.includes(submitted) ? 'solved' : mismatchVerdict(step, submitted, expectedFiles)
}
