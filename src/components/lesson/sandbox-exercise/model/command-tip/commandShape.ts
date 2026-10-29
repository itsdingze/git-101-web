import type { CommandWord } from '@/lib/git-sim/input/tokenize'

const MESSAGE_FLAGS = new Set(['-m', '-am', '-ma', '--message'])
const LIST_OPERATORS = new Set(['&&', '||', ';', ';;', '|'])

export function joinRaw(words: readonly CommandWord[]): string {
  return words.map((word) => word.raw).join(' ')
}

export function gitCommand(tokens: readonly CommandWord[]): string | null {
  return tokens[0]?.text === 'git' ? (tokens[1]?.text ?? null) : null
}

export function texts(tokens: readonly CommandWord[]): string[] {
  return tokens.map((token) => token.text)
}

function isWord(token: CommandWord | undefined): token is CommandWord {
  return token !== undefined && !token.quoted && !token.raw.startsWith('-') && !LIST_OPERATORS.has(token.raw)
}

export function wordsAfter(tokens: readonly CommandWord[], start: number): number {
  let end = start
  while (isWord(tokens[end])) end += 1
  return end
}

export function quoteWords(tokens: readonly CommandWord[], start: number, end: number): string {
  const words = tokens.slice(start, end).map((token) => token.raw).join(' ')
  return [joinRaw(tokens.slice(0, start)), `"${words}"`, joinRaw(tokens.slice(end))].filter(Boolean).join(' ')
}

export function takesMessage(tokens: readonly CommandWord[]): boolean {
  const [program, command, subcommand] = texts(tokens)
  return program === 'git' && (command === 'commit' || (command === 'stash' && subcommand === 'push'))
}

export function messageFlagIndex(tokens: readonly CommandWord[]): number {
  return tokens.findIndex((token) => !token.quoted && MESSAGE_FLAGS.has(token.text))
}
