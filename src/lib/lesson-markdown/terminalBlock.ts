import type { TerminalBlock, TerminalTranscriptLine } from '@/types'
import { alignShellComments, type ShellLine } from '../text/shellComment'

const PROMPTED = /^(~\S*)(?: \(([^)]+)\))? \$(?: (.*))?$/

function classify({ code, comment }: ShellLine): TerminalTranscriptLine {
  if (code === '' && comment !== '') return { kind: 'note', text: comment }

  const prompted = PROMPTED.exec(code)
  if (!prompted) return { kind: 'output', text: code, note: comment }

  const [, directory = '~', branch, command = ''] = prompted
  return { kind: 'command', prompt: { directory, branch: branch ?? null }, text: command, note: comment }
}

export function parseTerminalBlock(body: readonly string[]): TerminalBlock {
  let inHunk = false
  const sourceLines = body.map((line) => {
    if (PROMPTED.test(line) || line.startsWith('diff --git ')) inHunk = false
    if (line.startsWith('@@ ')) {
      inHunk = true
      return false
    }
    return inHunk && /^(?:[ +\-\\]|$)/.test(line)
  })
  const annotated = alignShellComments(body.map((line, index) => sourceLines[index] ? '' : line))
  const lines = annotated.map((line, index) =>
    sourceLines[index] ? { kind: 'output' as const, text: body[index] ?? '', note: '' } : classify(line),
  )
  return { type: 'terminal', lines }
}
