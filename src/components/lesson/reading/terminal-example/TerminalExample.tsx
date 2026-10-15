import type { TerminalBlock } from '@/types'
import { PromptLabel } from '@/components/lesson/terminal/PromptLabel'
import { TerminalFrame } from '@/components/lesson/terminal/TerminalFrame'
import { useScrollableRegion } from '@/components/lesson/reading/hooks/useScrollableRegion'
import { transcriptGroups, type TranscriptGroup } from './model/transcriptGroups'
import { messages } from '@/messages/en'

interface TerminalExampleProps {
  block: TerminalBlock
}

function Note({ text }: { text: string }) {
  return text ? <span className="select-none text-code-muted">{text}</span> : null
}

function lineKey(text: string, index: number): string {
  return `${index}-${text.slice(0, 32)}`
}

function groupKey(group: TranscriptGroup, index: number): string {
  return lineKey(group.kind === 'command' ? group.line.text : (group.lines[0]?.text ?? ''), index)
}

function TranscriptGroupLines({ group }: { group: TranscriptGroup }) {
  if (group.kind === 'command') {
    const { prompt, text, note } = group.line
    return (
      <div className="text-terminal-text">
        <PromptLabel prompt={prompt} />
        {text && ` ${text}`}
        <Note text={note} />
      </div>
    )
  }

  return (
    <div className="text-terminal-muted">
      {group.lines.map((line, index) => (
        <span key={lineKey(line.text, index)} className="block">
          {line.kind === 'note' ? <Note text={line.text} /> : (line.text || ' ')}
          {line.kind === 'output' && <Note text={line.note} />}
        </span>
      ))}
    </div>
  )
}

export function TerminalExample({ block }: TerminalExampleProps) {
  const { ref, regionProps } = useScrollableRegion<HTMLDivElement>(messages.reading.terminalExample.region)

  return (
    <TerminalFrame title={messages.reading.terminalExample.windowTitle} ref={ref} {...regionProps}>
      {transcriptGroups(block.lines).map((group, index) => (
        <TranscriptGroupLines key={groupKey(group, index)} group={group} />
      ))}
    </TerminalFrame>
  )
}
