export type Redirection = {
  target: string
  append: boolean
}

type RedirectOperator = '>' | '>>' | '<'

type ListOperator = '&&' | '||' | ';' | ';;' | '|'

export type Connector = '&&' | '||' | ';'

export type CommandWord = {
  text: string
  raw: string
  quoted: boolean
}

type Piece =
  | { word: string; raw: string; quoted: boolean; pattern: string | null }
  | { operator: RedirectOperator }
  | { list: ListOperator }

type WordPiece = Extract<Piece, { word: string }>

export type ShellWord = {
  text: string
  pattern: string | null
}

export type ParsedCommand = {
  words: ShellWord[]
  typed: string
  redirection: Redirection | null
  input: string | null
}

export type ListedCommand = {
  connector: Connector | null
  command: ParsedCommand
}

export type UnsupportedSyntax =
  | { kind: 'pipe' }
  | { kind: 'variable'; name: string }
  | { kind: 'command-substitution' }
  | { kind: 'backtick' }

type CommandList =
  | { kind: 'commands'; commands: ListedCommand[] }
  | { kind: 'continues'; after: '\\' | '&&' | '||' }
  | { kind: 'syntax-error'; token: string }
  | { kind: 'unsupported'; syntax: UnsupportedSyntax }

const ESCAPABLE_IN_DOUBLE_QUOTES = new Set(['"', '\\', '$', '`'])

const VARIABLE = /^\$(?:[A-Za-z_][A-Za-z0-9_]*|\{[^}]*\}?)/

const GLOB_SPECIALS = /[*?\\]/g

type Split = {
  pieces: Piece[]
  continuesLine: boolean
  expansion: UnsupportedSyntax | null
}

function expansionAt(line: string, index: number): UnsupportedSyntax | null {
  if (line[index] === '`') return { kind: 'backtick' }
  if (line[index + 1] === '(') return { kind: 'command-substitution' }
  const variable = VARIABLE.exec(line.slice(index))
  return variable ? { kind: 'variable', name: variable[0] } : null
}

function isWord(piece: Piece | undefined): piece is WordPiece {
  return piece !== undefined && 'word' in piece
}

function listOperatorAt(line: string, index: number): ListOperator | null {
  const pair = line.slice(index, index + 2)
  if (pair === '&&' || pair === '||' || pair === ';;') return pair
  const char = line[index]
  if (char === ';' || char === '|') return char
  return null
}

function splitPieces(line: string): Split {
  const pieces: Piece[] = []
  let current = ''
  let raw = ''
  let quote: '"' | "'" | null = null
  let quoted = false
  let escaping = false
  let expansion: UnsupportedSyntax | null = null
  let pattern = ''
  let wildcard = false

  const appendLiteral = (text: string) => {
    current += text
    pattern += text.replace(GLOB_SPECIALS, '\\$&')
  }

  const appendUnquoted = (char: string) => {
    current += char
    pattern += char
    wildcard ||= char === '*' || char === '?'
  }

  const endWord = () => {
    if (current || quoted) {
      pieces.push({ word: current, raw, quoted, pattern: wildcard ? pattern : null })
      current = ''
      raw = ''
      quoted = false
      pattern = ''
      wildcard = false
    }
  }

  const pushOperator = (operator: RedirectOperator) => {
    endWord()
    const last = pieces[pieces.length - 1]
    if (operator === '>' && last && 'operator' in last && last.operator === '>') last.operator = '>>'
    else pieces.push({ operator })
  }

  for (let index = 0; index < line.length; index += 1) {
    const char = line.charAt(index)
    const literal = escaping || quote !== null
    const list = literal ? null : listOperatorAt(line, index)
    const separator = char === ' ' || char === '\t' || char === '>' || char === '<' || list !== null
    if (literal || !separator) raw += char
    if (escaping) {
      escaping = false
      if (quote === '"' && !ESCAPABLE_IN_DOUBLE_QUOTES.has(char)) appendLiteral('\\')
      appendLiteral(char)
      continue
    }
    if (char === '\\' && quote !== "'") {
      escaping = true
      continue
    }
    if ((char === '$' || char === '`') && quote !== "'") expansion ??= expansionAt(line, index)
    if (quote) {
      if (char === quote) {
        quote = null
        continue
      }
      appendLiteral(char)
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
    if (list) {
      endWord()
      pieces.push({ list })
      index += list.length - 1
      continue
    }
    appendUnquoted(char)
  }

  endWord()
  return { pieces, continuesLine: escaping, expansion }
}

function pieceText(piece: Piece | undefined): string {
  if (!piece) return 'newline'
  if ('word' in piece) return piece.word
  return 'operator' in piece ? piece.operator : piece.list
}

function parseCommand(pieces: readonly Piece[], start: number): ParsedCommand | { unexpected: string } {
  const command: ParsedCommand = { words: [], typed: '', redirection: null, input: null }

  for (let index = start; index < pieces.length; index += 1) {
    const piece = pieces[index]
    if (!piece || 'list' in piece) break
    if ('word' in piece) {
      command.words.push({ text: piece.word, pattern: piece.pattern })
      command.typed = command.typed ? `${command.typed} ${piece.raw}` : piece.raw
      continue
    }

    const next = pieces[index + 1]
    if (!isWord(next)) return { unexpected: pieceText(next) }
    index += 1
    if (piece.operator === '<') command.input = next.word
    else command.redirection = { target: next.word, append: piece.operator === '>>' }
  }

  return command
}

function commandPieces(pieces: readonly Piece[], start: number): Piece[] {
  const end = pieces.findIndex((piece, index) => index >= start && 'list' in piece)
  return pieces.slice(start, end === -1 ? pieces.length : end)
}

export function commandWords(line: string): CommandWord[] {
  return splitPieces(line).pieces.map((piece) =>
    'word' in piece
      ? { text: piece.word, raw: piece.raw, quoted: piece.quoted }
      : { text: pieceText(piece), raw: pieceText(piece), quoted: false },
  )
}

export function lastCommandWords(line: string): string[] {
  const { pieces } = splitPieces(line)
  const lastList = pieces.reduce((found, piece, index) => ('list' in piece ? index : found), -1)
  return pieces.slice(lastList + 1).map(pieceText)
}

export function parseCommandList(line: string): CommandList {
  const { pieces, continuesLine, expansion } = splitPieces(line)
  if (continuesLine) return { kind: 'continues', after: '\\' }

  const commands: ListedCommand[] = []
  let connector: Connector | null = null
  let piped = false
  let start = 0

  while (start < pieces.length) {
    const own = commandPieces(pieces, start)
    const operator = pieces[start + own.length]
    const list = operator && 'list' in operator ? operator.list : null

    if (own.length === 0) return { kind: 'syntax-error', token: pieceText(operator) }
    const command = parseCommand(pieces, start)
    if ('unexpected' in command) return { kind: 'syntax-error', token: command.unexpected }
    commands.push({ connector, command })

    if (list === null) break
    if (list === ';;') return { kind: 'syntax-error', token: list }
    start += own.length + 1
    if (list === '|') {
      piped = true
      continue
    }
    connector = list
    const lineEnded = start >= pieces.length && !piped
    if (lineEnded && (list === '&&' || list === '||')) return { kind: 'continues', after: list }
  }

  if (piped) return { kind: 'unsupported', syntax: { kind: 'pipe' } }
  if (expansion) return { kind: 'unsupported', syntax: expansion }
  return { kind: 'commands', commands }
}
