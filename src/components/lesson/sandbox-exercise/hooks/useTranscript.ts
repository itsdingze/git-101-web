import { useCallback, useState } from 'react'
import {
  EMPTY_TRANSCRIPT,
  appendToTranscript,
  restartTranscript,
  settleCommand,
  type TerminalEntry,
  type TerminalLine,
} from '@/components/lesson/sandbox-exercise/model/transcript'
import type { CoachLine } from '@/components/lesson/sandbox-exercise/model/coachLines'
import type { RunResult } from '@/lib/git-sim/runCommand'

interface TranscriptState {
  lines: readonly TerminalLine[]
  append: (entries: readonly TerminalEntry[]) => void
  restart: (entries: readonly TerminalEntry[]) => void
  settle: (result: RunResult, coach: { opening: readonly CoachLine[]; coach: readonly CoachLine[] }) => void
}

export function useTranscript(): TranscriptState {
  const [transcript, setTranscript] = useState(EMPTY_TRANSCRIPT)

  const append = useCallback((entries: readonly TerminalEntry[]) => {
    setTranscript((current) => appendToTranscript(current, entries))
  }, [])

  const restart = useCallback((entries: readonly TerminalEntry[]) => {
    setTranscript((current) => restartTranscript(current, entries))
  }, [])

  const settle = useCallback<TranscriptState['settle']>((result, coach) => {
    setTranscript((current) => settleCommand(current, result, coach))
  }, [])

  return { lines: transcript.lines, append, restart, settle }
}
