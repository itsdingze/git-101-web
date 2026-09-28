import { joinRaw, tokenizeCommand, type CommandToken } from './commandTokens'

type Output = {
  stream: 'stdout' | 'stderr'
  text: string
}

const COPIED_PROMPT = /^\$\s/
const CURLY_QUOTES = /[“”‘’]/
const MESSAGE_FLAGS = new Set(['-m', '-am', '-ma', '--message'])
const CONFIG_SCOPES = new Set(['--global', '--local', '--system'])
const MISSING_REMOTE = /does not appear to be a git repository|No configured push destination/

function failed(outputs: readonly Output[]): boolean {
  return outputs.some((output) => output.stream === 'stderr')
}

function isWord(token: CommandToken | undefined): token is CommandToken {
  return token !== undefined && !token.quoted && !token.raw.startsWith('-')
}

function wordsAfter(tokens: readonly CommandToken[], start: number): number {
  let end = start
  while (isWord(tokens[end])) end += 1
  return end
}

function quoteWords(tokens: readonly CommandToken[], start: number, end: number): string {
  const words = tokens.slice(start, end).map((token) => token.raw).join(' ')
  return [joinRaw(tokens.slice(0, start)), `"${words}"`, joinRaw(tokens.slice(end))].filter(Boolean).join(' ')
}

function takesMessage(tokens: readonly CommandToken[]): boolean {
  const [program, command, subcommand] = tokens.map((token) => token.text)
  return program === 'git' && (command === 'commit' || (command === 'stash' && subcommand === 'push'))
}

function copiedNoteTip(tokens: readonly CommandToken[], outputs: readonly Output[]): string | null {
  if (!failed(outputs)) return null
  const note = tokens.findIndex((token) => !token.quoted && token.raw.startsWith('#'))
  if (note <= 0) return null
  return `Leave out the note after \`#\`. Copy only the command itself: \`${joinRaw(tokens.slice(0, note))}\``
}

function curlyQuoteTip(line: string, outputs: readonly Output[]): string | null {
  if (!failed(outputs) || !CURLY_QUOTES.test(line)) return null
  const straightened = line.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  return `Those are curly quotes, which the terminal does not treat as quotes. Type straight quotes instead: \`${straightened}\``
}

function unquotedMessageTip(tokens: readonly CommandToken[]): string | null {
  if (!takesMessage(tokens)) return null
  const flag = tokens.findIndex((token) => !token.quoted && MESSAGE_FLAGS.has(token.text))
  if (flag === -1) return null

  const end = wordsAfter(tokens, flag + 1)
  if (end - (flag + 1) < 2) return null
  return `Put the message in quotes, so Git reads it as one message: \`${quoteWords(tokens, flag + 1, end)}\``
}

function unquotedNameTip(tokens: readonly CommandToken[], outputs: readonly Output[]): string | null {
  const texts = tokens.map((token) => token.text)
  if (texts[0] !== 'git' || texts[1] !== 'config') return null
  const key = CONFIG_SCOPES.has(texts[2] ?? '') ? 3 : 2
  if (texts[key] !== 'user.name') return null

  const end = wordsAfter(tokens, key + 1)
  if (end - (key + 1) < 2 || end !== tokens.length) return null

  const suggestion = quoteWords(tokens, key + 1, end)
  if (failed(outputs)) {
    return `Git could not read that as one name, so nothing was saved. Put your full name in quotes: \`${suggestion}\``
  }
  return `Only the first word, \`${tokens[key + 1]?.raw}\`, was saved as your name. Put your full name in quotes: \`${suggestion}\``
}

function mergeDirectionTip(tokens: readonly CommandToken[], branch: string | null): string | null {
  if (!branch || branch === 'main') return null
  const texts = tokens.map((token) => token.text)
  if (texts.length !== 3 || texts[0] !== 'git' || texts[1] !== 'merge' || texts[2] !== 'main') return null
  return `You are on \`${branch}\`, so this brings \`main\` into \`${branch}\`. If you meant to bring \`${branch}\` into \`main\`, run \`git switch main\` first, then \`git merge ${branch}\`.`
}

function missingRemoteTip(tokens: readonly CommandToken[], outputs: readonly Output[]): string | null {
  const [program, command] = tokens.map((token) => token.text)
  if (program !== 'git' || command !== 'push') return null
  if (!outputs.some((output) => output.stream === 'stderr' && MISSING_REMOTE.test(output.text))) return null
  return 'This project is not connected to GitHub yet, so there is nowhere to send it. Connect it first with `git remote add origin <url>`, using the address of your GitHub repository, then try again.'
}

export function commandTip(line: string, outputs: readonly Output[], branch: string | null = null): string | null {
  if (COPIED_PROMPT.test(line)) return 'Leave out the `$` at the start. It is the prompt, not part of the command.'

  const tokens = tokenizeCommand(line)
  return (
    copiedNoteTip(tokens, outputs) ??
    curlyQuoteTip(line, outputs) ??
    unquotedMessageTip(tokens) ??
    unquotedNameTip(tokens, outputs) ??
    mergeDirectionTip(tokens, branch) ??
    missingRemoteTip(tokens, outputs)
  )
}
