import { firstCapture, printed, type TipRule } from './tipRule'
import { gitCommand, messageFlagIndex, takesMessage } from './commandShape'

const NOTHING_STAGED = /^(no changes added to commit|nothing added to commit but untracked files present)/m
const UNKNOWN_REVISION = /^fatal: ambiguous argument '([^']+)': unknown revision/m
const NEW_COMMIT = /^\[\S+ (\(root-commit\) )?[0-9a-f]{7}\]/m
const TYPED_MESSAGE = /^([a-z]+(\([^)]*\))?!?: \S|Merge |Revert )/

export const emptyDiffTip: TipRule = ({ tokens, outputs }) => {
  if (tokens.length !== 2 || gitCommand(tokens) !== 'diff') return null
  if (outputs.some((output) => output.text !== '')) return null
  return 'No output means no unstaged changes to tracked files. Use `git status` to check for new files and `git diff --staged` to inspect staged changes.'
}

export const unknownCommitTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'show') return null
  const revision = firstCapture(outputs, UNKNOWN_REVISION)
  if (!revision) return null
  return `\`${revision}\` isn't in your history. Run \`git log --oneline\` and use a hash from your own list.`
}

export const nothingStagedTip: TipRule = ({ tokens, outputs }) => {
  if (!takesMessage(tokens) || tokens[1]?.text !== 'commit') return null
  if (!printed(outputs, NOTHING_STAGED)) return null
  return "Nothing is staged, so there's nothing to commit. Stage your changes with `git add <file>` first, then commit."
}

export const untypedMessageTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'commit' || !printed(outputs, NEW_COMMIT)) return null
  const flag = messageFlagIndex(tokens)
  const message = tokens[flag + 1]
  if (flag === -1 || !message || TYPED_MESSAGE.test(message.text)) return null
  return 'This course starts each message with its type, like `feat: add search` or `fix: stop crash`.'
}
