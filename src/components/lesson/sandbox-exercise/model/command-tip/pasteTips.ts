import { failed, type TipRule } from './tipRule'
import { joinRaw } from './commandShape'

const COPIED_PROMPT = /^\$\s/
const COPIED_FULL_PROMPT = /^~\S*(?: \([^)]*\))? \$\s+(.+)$/
const CURLY_QUOTES = /[“”‘’]/

export const copiedPromptTip: TipRule = ({ line }) => {
  if (!COPIED_PROMPT.test(line)) return null
  return "Leave out the `$` at the start. It's the prompt, not part of the command."
}

export const copiedFullPromptTip: TipRule = ({ line }) => {
  const pastedCommand = COPIED_FULL_PROMPT.exec(line)?.[1]
  if (!pastedCommand) return null
  return `Leave out the prompt, everything up to and including the \`$\`. Type only the command: \`${pastedCommand}\``
}

export const copiedNoteTip: TipRule = ({ tokens, outputs }) => {
  if (!failed(outputs)) return null
  const note = tokens.findIndex((token) => !token.quoted && token.raw.startsWith('#'))
  if (note <= 0) return null
  return `Leave out the note after \`#\`. Copy only the command itself: \`${joinRaw(tokens.slice(0, note))}\``
}

export const curlyQuoteTip: TipRule = ({ line }) => {
  if (!CURLY_QUOTES.test(line)) return null
  const straightened = line.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  return `Those are curly quotes, which the terminal doesn't treat as quotes. Type straight quotes instead: \`${straightened}\``
}
