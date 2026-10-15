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

interface TranscriptState {
  lines: readonly TerminalLine[]
  append: (entries: readonly TerminalEntry[]) => void
  restart: (entries: readonly TerminalEntry[]) => void
  settle: (clearScreen: boolean, coach: { opening: readonly CoachLine[]; coach: readonly CoachLine[] }) => void
}

export function useTranscript(): TranscriptState {
  const [transcript, setTranscript] = useState(EMPTY_TRANSCRIPT)

  const append = useCallback((entries: readonly TerminalEntry[]) => {
    setTranscript((current) => appendToTranscript(current, entries))
  }, [])

  const restart = useCallback((entries: readonly TerminalEntry[]) => {
    setTranscript((current) => restartTranscript(current, entries))
  }, [])

  const settle = useCallback<TranscriptState['settle']>((clearScreen, coach) => {
    setTranscript((current) => settleCommand(current, clearScreen, coach))
  }, [])

  return { lines: transcript.lines, append, restart, settle }
}
