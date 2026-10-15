import { failed, printed, type TipRule } from './tipRule'
import { gitCommand, joinRaw, messageFlagIndex, quoteWords, takesMessage, texts, wordsAfter } from './commandShape'

const CONFIG_SCOPES = new Set(['--global', '--local', '--system'])
const NOT_IN_GIT_DIRECTORY = /^fatal: not in a git directory/m

export const unquotedMessageTip: TipRule = ({ tokens }) => {
  if (!takesMessage(tokens)) return null
  const flag = messageFlagIndex(tokens)
  if (flag === -1) return null

  const end = wordsAfter(tokens, flag + 1)
  if (end - (flag + 1) < 2) return null
  return `Put the message in quotes, so Git reads it as one message: \`${quoteWords(tokens, flag + 1, end)}\``
}

export const unquotedNameTip: TipRule = ({ tokens, outputs }) => {
  const words = texts(tokens)
  if (words[0] !== 'git' || words[1] !== 'config') return null
  const key = CONFIG_SCOPES.has(words[2] ?? '') ? 3 : 2
  if (words[key] !== 'user.name') return null

  const end = wordsAfter(tokens, key + 1)
  if (end - (key + 1) < 2 || end !== tokens.length) return null

  const suggestion = quoteWords(tokens, key + 1, end)
  if (failed(outputs)) {
    return `Git couldn't read that as one name, so nothing was saved. Put your full name in quotes: \`${suggestion}\``
  }
  return `Only the first word, \`${tokens[key + 1]?.raw}\`, was saved as your name. Put your full name in quotes: \`${suggestion}\``
}

export const missingConfigScopeTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'config' || !printed(outputs, NOT_IN_GIT_DIRECTORY)) return null
  const withGlobal = [joinRaw(tokens.slice(0, 2)), '--global', joinRaw(tokens.slice(2))].filter(Boolean).join(' ')
  return `Add \`--global\` so the setting covers every project: \`${withGlobal}\``
}
