export type Redirection = {
  target: string
  append: boolean
}

export type ParsedLine = {
  tokens: string[]
  redirection: Redirection | null
  redirectionMissingTarget: boolean
}

function splitTokens(line: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let quoted = false

  for (const char of line) {
    if (quote) {
      if (char === quote) {
        quote = null
        continue
      }
      current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      quoted = true
      continue
    }
    if (char === ' ' || char === '\t') {
      if (current || quoted) {
        tokens.push(current)
        current = ''
        quoted = false
      }
      continue
    }
    if (char === '>') {
      if (current || quoted) {
        tokens.push(current)
        current = ''
        quoted = false
      }
      const last = tokens[tokens.length - 1]
      if (last === '>') tokens[tokens.length - 1] = '>>'
      else tokens.push('>')
      continue
    }
    current += char
  }

  if (current || quoted) tokens.push(current)
  return tokens
}

export function parseLine(line: string): ParsedLine {
  const tokens = splitTokens(line)
  const arrow = tokens.findIndex((token) => token === '>' || token === '>>')
  if (arrow === -1) return { tokens, redirection: null, redirectionMissingTarget: false }

  const target = tokens[arrow + 1]
  if (target === undefined) {
    return { tokens: tokens.slice(0, arrow), redirection: null, redirectionMissingTarget: true }
  }

  return {
    tokens: tokens.slice(0, arrow),
    redirection: { target, append: tokens[arrow] === '>>' },
    redirectionMissingTarget: false,
  }
}
