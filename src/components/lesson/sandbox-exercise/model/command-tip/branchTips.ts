import { messages } from '@/messages/en'
import { firstCapture, printed, type TipRule } from './tipRule'
import { gitCommand } from './commandShape'

const COMMIT_LIKE = /^([0-9a-f]{4,40}|HEAD.*|.*[~^@].*)$/
const NOT_FULLY_MERGED = /is not fully merged/
const INVALID_REFERENCE = /^fatal: invalid reference: /m
const BRANCH_EXISTS = /^fatal: a branch named '([^']+)' already exists/m
const tips = messages.sandbox.tips

export const unmergedBranchTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, NOT_FULLY_MERGED)) return null
  return tips.unmergedBranch
}

export const missingBranchTip: TipRule = ({ tokens, outputs }) => {
  if (gitCommand(tokens) !== 'switch' || !printed(outputs, INVALID_REFERENCE)) return null
  const words = tokens.slice(2).filter((token) => !token.raw.startsWith('-')).map((token) => token.raw)
  const startPoint = words[1]
  if (startPoint && words.length === 2 && COMMIT_LIKE.test(startPoint)) {
    return tips.noSuchCommit(startPoint)
  }
  if (tokens.some((token) => token.text === '-c') && words.length > 1) {
    return tips.branchNameWithSpaces(words.join('-'))
  }
  const [name] = words
  if (!name) return null
  return tips.noSuchBranch(name)
}

export const branchExistsTip: TipRule = ({ outputs }) => {
  const name = firstCapture(outputs, BRANCH_EXISTS)
  if (!name) return null
  if (name === 'main') return tips.mainExists
  return tips.branchExists(name)
}
