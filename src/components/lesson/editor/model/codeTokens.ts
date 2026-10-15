import { conflictMarker } from './conflictMarker'

export type CodeTokenKind = 'plain' | 'function' | 'string' | 'number' | 'operator' | 'conflict-marker'

type CodeToken = {
  kind: CodeTokenKind
  text: string
}

const TOKEN = /(?<string>"[^"]*")|(?<function>[A-Za-z_]\w*(?=\())|(?<number>\b\d+(?:\.\d+)?\b)|(?<operator>=)/g

function matchedKind(groups: Record<string, string | undefined>): CodeTokenKind {
  if (groups.string) return 'string'
  if (groups.function) return 'function'
  if (groups.number) return 'number'
  return 'operator'
}

function appendPlain(tokens: CodeToken[], text: string): void {
  if (text) tokens.push({ kind: 'plain', text })
}

export function codeTokens(line: string): CodeToken[] {
  if (!line) return []
  if (conflictMarker(line)) return [{ kind: 'conflict-marker', text: line }]

  const tokens: CodeToken[] = []
  let end = 0
  for (const match of line.matchAll(TOKEN)) {
    appendPlain(tokens, line.slice(end, match.index))
    tokens.push({ kind: matchedKind(match.groups ?? {}), text: match[0] })
    end = match.index + match[0].length
  }
  appendPlain(tokens, line.slice(end))
  return tokens
}
