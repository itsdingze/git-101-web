export type Redirection = {
  target: string
  append: boolean
}

export type ParsedLine = {
  tokens: string[]
  redirection: Redirection | null
  redirectionMissingTarget: boolean
  continuesLine: boolean
}

const ESCAPABLE_IN_DOUBLE_QUOTES = new Set(['"', '\\', '$', '`'])

type Split = {
  tokens: string[]
  continuesLine: boolean
}

function splitTokens(line: string): Split {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let quoted = false
  let escaping = false

  const endToken = () => {
    if (current || quoted) {
      tokens.push(current)
      current = ''
      quoted = false
    }
  }

  for (const char of line) {
    if (escaping) {
      escaping = false
      if (quote === '"' && !ESCAPABLE_IN_DOUBLE_QUOTES.has(char)) current += '\\'
      current += char
      continue
    }
    if (char === '\\' && quote !== "'") {
      escaping = true
      continue
    }
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
      endToken()
      continue
    }
    if (char === '>') {
      endToken()
      const last = tokens[tokens.length - 1]
      if (last === '>') tokens[tokens.length - 1] = '>>'
      else tokens.push('>')
      continue
    }
    current += char
  }

  endToken()
  return { tokens, continuesLine: escaping }
}

export function parseLine(line: string): ParsedLine {
  const { tokens, continuesLine } = splitTokens(line)
  const arrow = tokens.findIndex((token) => token === '>' || token === '>>')
  if (arrow === -1) return { tokens, redirection: null, redirectionMissingTarget: false, continuesLine }

  const target = tokens[arrow + 1]
  if (target === undefined) {
    return { tokens: tokens.slice(0, arrow), redirection: null, redirectionMissingTarget: true, continuesLine }
  }

  return {
    tokens: tokens.slice(0, arrow),
    redirection: { target, append: tokens[arrow] === '>>' },
    redirectionMissingTarget: false,
    continuesLine,
  }
}
