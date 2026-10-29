import { messages } from '@/messages/en'
import { printed, type TipRule } from './tipRule'
import { texts } from './commandShape'

const MERGE_CONFLICT = /^CONFLICT /m
const ALREADY_UP_TO_DATE = /^Already up to date\.$/m
const UNRESOLVED_CONFLICT = /^fatal: Exiting because of an unresolved conflict/m
const UNCOMMITTED_BEFORE_MERGE = /^Please commit your changes or stash them before you merge/m
const tips = messages.sandbox.tips

export const newOnGitHubMainTip: TipRule = ({ tokens, outputs, branch, newOnGitHubMain }) => {
  if (!newOnGitHubMain || !branch || branch === 'main') return null
  if (texts(tokens).join(' ') !== 'git merge main' || !printed(outputs, ALREADY_UP_TO_DATE)) return null
  return tips.newOnGitHubMain
}

export const mergeDirectionTip: TipRule = ({ tokens, outputs, branch }) => {
  if (!branch || branch === 'main') return null
  const words = texts(tokens)
  if (words.length !== 3 || words[0] !== 'git' || words[1] !== 'merge' || words[2] !== 'main') return null
  if (printed(outputs, MERGE_CONFLICT)) return tips.mergeDirectionAfterConflict(branch)
  return tips.mergeDirection(branch)
}

export const mergeCurrentBranchTip: TipRule = ({ tokens, branch }) => {
  const words = texts(tokens)
  if (!branch || branch === 'main' || words.length !== 3 || words[0] !== 'git' || words[1] !== 'merge' || words[2] !== branch) return null
  return tips.mergeCurrentBranch(branch)
}

export const unresolvedConflictTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, UNRESOLVED_CONFLICT)) return null
  return tips.unresolvedConflict
}

export const uncommittedBeforeMergeTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, UNCOMMITTED_BEFORE_MERGE)) return null
  return tips.uncommittedBeforeMerge
}
