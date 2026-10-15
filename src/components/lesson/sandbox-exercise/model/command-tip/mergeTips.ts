import { printed, type TipRule } from './tipRule'
import { texts } from './commandShape'

const MERGE_CONFLICT = /^CONFLICT /m
const ALREADY_UP_TO_DATE = /^Already up to date\.$/m
const UNRESOLVED_CONFLICT = /^fatal: Exiting because of an unresolved conflict/m
const UNCOMMITTED_BEFORE_MERGE = /^Please commit your changes or stash them before you merge/m

export const newOnGitHubMainTip: TipRule = ({ tokens, outputs, branch, newOnGitHubMain }) => {
  if (!newOnGitHubMain || !branch || branch === 'main') return null
  if (texts(tokens).join(' ') !== 'git merge main' || !printed(outputs, ALREADY_UP_TO_DATE)) return null
  return "The new work is on GitHub's `main`, not on your `main` yet. Run `git pull origin main` to bring it into this branch."
}

export const mergeDirectionTip: TipRule = ({ tokens, outputs, branch }) => {
  if (!branch || branch === 'main') return null
  const words = texts(tokens)
  if (words.length !== 3 || words[0] !== 'git' || words[1] !== 'merge' || words[2] !== 'main') return null
  const direction = `You're on \`${branch}\`, so this brings \`main\` into \`${branch}\`.`
  if (printed(outputs, MERGE_CONFLICT)) {
    return `${direction} If you meant to bring \`${branch}\` into \`main\`, press Start over, then run \`git switch main\` and \`git merge ${branch}\`.`
  }
  return `${direction} If you meant to bring \`${branch}\` into \`main\`, run \`git switch main\` first, then \`git merge ${branch}\`.`
}

export const mergeCurrentBranchTip: TipRule = ({ tokens, branch }) => {
  const words = texts(tokens)
  if (!branch || branch === 'main' || words.length !== 3 || words[0] !== 'git' || words[1] !== 'merge' || words[2] !== branch) return null
  return `You're already on \`${branch}\`, so there's nothing to bring in. Move to the branch that should receive the work first, like \`git switch main\`, then run \`git merge ${branch}\`.`
}

export const unresolvedConflictTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, UNRESOLVED_CONFLICT)) return null
  return 'A file still has a conflict. Fix it, stage it with `git add <file>` to mark it settled, then commit.'
}

export const uncommittedBeforeMergeTip: TipRule = ({ outputs }) => {
  if (!printed(outputs, UNCOMMITTED_BEFORE_MERGE)) return null
  return "You have changes that aren't committed yet. Commit or stash them first, then run the command again."
}
