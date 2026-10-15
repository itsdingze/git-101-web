import type { PromptInfo } from '@/lib/git-sim/createSandbox'
import type { Completion } from '@/lib/git-sim/input/completion'
import type { TerminalLine } from './transcript'

export interface TerminalSession {
  ready: boolean
  lines: readonly TerminalLine[]
  prompt: PromptInfo
  submit: (line: string) => void
  complete: (line: string, cursor: number) => Promise<Completion | null>
  listCompletions: (line: string, matches: readonly string[]) => void
}
