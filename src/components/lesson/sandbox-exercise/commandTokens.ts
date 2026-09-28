export type CommandToken = {
  text: string
  raw: string
  quoted: boolean
}

const QUOTES = new Set(['"', "'"])

export function tokenizeCommand(line: string): CommandToken[] {
  const tokens: CommandToken[] = []
  let text = ''
  let raw = ''
  let quoted = false
  let openQuote: string | null = null

  const flush = () => {
    if (raw) tokens.push({ text, raw, quoted })
    text = ''
    raw = ''
    quoted = false
  }

  for (const character of line) {
    if (openQuote) {
      raw += character
      if (character === openQuote) openQuote = null
      else text += character
      continue
    }
    if (QUOTES.has(character)) {
      openQuote = character
      quoted = true
      raw += character
      continue
    }
    if (/\s/.test(character)) {
      flush()
      continue
    }
    raw += character
    text += character
  }
  flush()
  return tokens
}

export function joinRaw(tokens: readonly CommandToken[]): string {
  return tokens.map((token) => token.raw).join(' ')
}
