export type Redirection = {
  target: string
  append: boolean
}

type ParsedLine = {
  tokens: string[]
  redirection: Redirection | null
  input: string | null
  redirectionMissingTarget: boolean
  continuesLine: boolean
}

type Operator = '>' | '>>' | '<'

export type CommandWord = {
  text: string
  raw: string
  quoted: boolean
}

type Piece = { word: string; raw: string; quoted: boolean } | { operator: Operator }

const ESCAPABLE_IN_DOUBLE_QUOTES = new Set(['"', '\\', '$', '`'])

type Split = {
  pieces: Piece[]
  continuesLine: boolean
}

function splitPieces(line: string): Split {
  const pieces: Piece[] = []
  let current = ''
  let raw = ''
  let quote: '"' | "'" | null = null
  let quoted = false
  let escaping = false

  const endWord = () => {
    if (current || quoted) {
      pieces.push({ word: current, raw, quoted })
      current = ''
      raw = ''
      quoted = false
    }
  }

  const pushOperator = (operator: Operator) => {
    endWord()
    const last = pieces[pieces.length - 1]
    if (operator === '>' && last && 'operator' in last && last.operator === '>') last.operator = '>>'
    else pieces.push({ operator })
  }

  for (const char of line) {
    const literal = escaping || quote !== null
    const separator = char === ' ' || char === '\t' || char === '>' || char === '<'
    if (literal || !separator) raw += char
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
      endWord()
      continue
    }
    if (char === '>' || char === '<') {
      pushOperator(char)
      continue
    }
    current += char
  }

  endWord()
  return { pieces, continuesLine: escaping }
}

export function commandWords(line: string): CommandWord[] {
  return splitPieces(line).pieces.map((piece) =>
    'word' in piece
      ? { text: piece.word, raw: piece.raw, quoted: piece.quoted }
      : { text: piece.operator, raw: piece.operator, quoted: false },
  )
}

export function parseLine(line: string): ParsedLine {
  const { pieces, continuesLine } = splitPieces(line)
  const parsed: ParsedLine = {
    tokens: [],
    redirection: null,
    input: null,
    redirectionMissingTarget: false,
    continuesLine,
  }

  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index]
    if (!piece) continue
    if ('word' in piece) {
      parsed.tokens.push(piece.word)
      continue
    }

    const next = pieces[index + 1]
    if (!next || !('word' in next)) {
      parsed.redirectionMissingTarget = true
      return parsed
    }
    index += 1
    if (piece.operator === '<') parsed.input = next.word
    else parsed.redirection = { target: next.word, append: piece.operator === '>>' }
  }

  return parsed
}
