import type { TerminalTranscriptLine } from '@/types'

type CommandLine = Extract<TerminalTranscriptLine, { kind: 'command' }>
type PrintedLine = Exclude<TerminalTranscriptLine, CommandLine>

export type TranscriptGroup = { kind: 'command'; line: CommandLine } | { kind: 'printed'; lines: PrintedLine[] }

function isSamePrompt(a: CommandLine['prompt'], b: CommandLine['prompt']): boolean {
  return a.directory === b.directory && a.branch === b.branch
}

function withoutRepeatedClosingPrompt(lines: readonly TerminalTranscriptLine[]): readonly TerminalTranscriptLine[] {
  const closing = lines[lines.length - 1]
  if (closing?.kind !== 'command' || closing.text || closing.note) return lines
  const previous = lines.slice(0, -1).reverse().find((line): line is CommandLine => line.kind === 'command')
  return previous && isSamePrompt(previous.prompt, closing.prompt) ? lines.slice(0, -1) : lines
}

export function transcriptGroups(lines: readonly TerminalTranscriptLine[]): TranscriptGroup[] {
  const groups: TranscriptGroup[] = []
  for (const line of withoutRepeatedClosingPrompt(lines)) {
    const last = groups[groups.length - 1]
    if (line.kind === 'command') groups.push({ kind: 'command', line })
    else if (last?.kind === 'printed') last.lines.push(line)
    else groups.push({ kind: 'printed', lines: [line] })
  }
  return groups
}
