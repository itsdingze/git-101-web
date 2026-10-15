import { firstCapture, printed, type TipRule } from './tipRule'
import { gitCommand } from './commandShape'

const COMMIT_LIKE = /^([0-9a-f]{4,40}|HEAD.*|.*[~^@].*)$/
const NOT_FULLY_MERGED = /is not fully merged/
const INVALID_REFERENCE = /^fatal: invalid reference: /m
const BRANCH_EXISTS = /^fatal: a branch named '([^']+)' already exists/m

export const unmergedBranchTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, NOT_FULLY_MERGED)) return null
  return "Git couldn't confirm that this branch is merged. Merge work you need before deleting it. `-D` skips that check and can make unmerged commits hard to recover."
}

export const missingBranchTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'switch' || !printed(outputs, INVALID_REFERENCE)) return null
  const words = tokens.slice(2).filter((token) => !token.raw.startsWith('-')).map((token) => token.raw)
  const startPoint = words[1]
  if (startPoint && words.length === 2 && COMMIT_LIKE.test(startPoint)) {
    return `There's no commit \`${startPoint}\` in this repository. Run \`git log --oneline\` and copy a hash from its list.`
  }
  if (tokens.some((token) => token.text === '-c') && words.length > 1) {
    return `Branch names can't have spaces. Join the words with hyphens: \`git switch -c ${words.join('-')}\``
  }
  const [name] = words
  if (!name) return null
  return `There's no branch called \`${name}\` yet. To create it and move onto it, add \`-c\`: \`git switch -c ${name}\``
}

export const branchExistsTip: TipRule = ({ outputs }) => {
  const name = firstCapture(outputs, BRANCH_EXISTS)
  if (!name) return null
  if (name === 'main') return '`main` already exists. Move onto it with `git switch main`.'
  return `You already have a branch called \`${name}\`. Move onto it with \`git switch ${name}\`, or delete it with \`git branch -d ${name}\` and try again.`
}
