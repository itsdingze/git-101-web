import type { PromptInfo } from '@/lib/git-sim/createSandbox'
import type { RunResult } from '@/lib/git-sim/runCommand'
import type { CoachKind, CoachLine } from './coachLines'

export type TerminalLine = {
  id: number
  kind: 'command' | 'stdout' | 'stderr' | CoachKind
  text: string
  prompt?: PromptInfo
}

export type TerminalEntry = Omit<TerminalLine, 'id'>

type Transcript = {
  lines: readonly TerminalLine[]
  nextId: number
}

interface SettleCoach {
  opening: readonly CoachLine[]
  coach: readonly CoachLine[]
}

export const EMPTY_TRANSCRIPT: Transcript = { lines: [], nextId: 0 }

function numbered(entries: readonly TerminalEntry[], firstId: number): TerminalLine[] {
  return entries.map((entry, index) => ({ ...entry, id: firstId + index }))
}

export function appendToTranscript(transcript: Transcript, entries: readonly TerminalEntry[]): Transcript {
  return {
    lines: [...transcript.lines, ...numbered(entries, transcript.nextId)],
    nextId: transcript.nextId + entries.length,
  }
}

export function restartTranscript(transcript: Transcript, entries: readonly TerminalEntry[]): Transcript {
  return { lines: numbered(entries, transcript.nextId), nextId: transcript.nextId + entries.length }
}

function outputEntries(result: RunResult): TerminalEntry[] {
  return result.outputs.filter((output) => output.text !== '').map((output) => ({ kind: output.stream, text: output.text }))
}

export function printedEntries(result: RunResult): TerminalEntry[] {
  return result.clearScreen ? [] : outputEntries(result)
}

export function settleCommand(transcript: Transcript, result: RunResult, { opening, coach }: SettleCoach): Transcript {
  if (result.clearScreen) return restartTranscript(transcript, [...opening, ...outputEntries(result), ...coach])
  return appendToTranscript(transcript, coach)
}
