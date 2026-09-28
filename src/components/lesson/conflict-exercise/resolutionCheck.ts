import type { ConflictExerciseStep } from '@/types'
import { composeResolvedFile } from './conflictFileText'

export type ResolutionVerdict = 'solved' | 'marker-left' | 'wrong-content'

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

export function checkResolution(step: ConflictExerciseStep, buffer: string): ResolutionVerdict {
  if (hasConflictMarker(buffer)) return 'marker-left'

  const submitted = normalizeFile(buffer)
  const matches = step.acceptableResolutions.some(
    (resolution) => normalizeFile(composeResolvedFile(step, resolution)) === submitted,
  )

  return matches ? 'solved' : 'wrong-content'
}
