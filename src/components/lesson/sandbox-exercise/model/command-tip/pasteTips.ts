import { messages } from '@/messages/en'
import { failed, type TipRule } from './tipRule'
import { joinRaw } from './commandShape'

const COPIED_PROMPT = /^\$\s/
const COPIED_FULL_PROMPT = /^~\S*(?: \([^)]*\))? \$\s+(.+)$/
const CURLY_QUOTES = /[“”‘’]/
const tips = messages.sandbox.tips

export const copiedPromptTip: TipRule = ({ line }) => {
  if (!COPIED_PROMPT.test(line)) return null
  return tips.copiedPrompt
}

export const copiedFullPromptTip: TipRule = ({ line }) => {
  const pastedCommand = COPIED_FULL_PROMPT.exec(line)?.[1]
  if (!pastedCommand) return null
  return tips.copiedFullPrompt(pastedCommand)
}

export const copiedNoteTip: TipRule = ({ tokens, outputs }) => {
  if (!failed(outputs)) return null
  const note = tokens.findIndex((token) => !token.quoted && token.raw.startsWith('#'))
  if (note <= 0) return null
  return tips.copiedNote(joinRaw(tokens.slice(0, note)))
}

export const curlyQuoteTip: TipRule = ({ line }) => {
  if (!CURLY_QUOTES.test(line)) return null
  const straightened = line.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  return tips.curlyQuotes(straightened)
}
