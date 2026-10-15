import type { FolderContents } from '@/lib/git-sim/fs/folderContents'
import { commandWords } from '@/lib/git-sim/input/tokenize'
import type { Output, TipContext, TipRule } from './command-tip/tipRule'
import { copiedFullPromptTip, copiedNoteTip, copiedPromptTip, curlyQuoteTip } from './command-tip/pasteTips'
import { missingConfigScopeTip, unquotedMessageTip, unquotedNameTip } from './command-tip/quotingTips'
import {
  mergeCurrentBranchTip,
  mergeDirectionTip,
  newOnGitHubMainTip,
  uncommittedBeforeMergeTip,
  unresolvedConflictTip,
} from './command-tip/mergeTips'
import {
  cloneOwnerAndRepositoryTip,
  cloneSchemeTip,
  forcePushTip,
  missingRemoteTip,
  remoteExistsTip,
  repositoryNotFoundTip,
} from './command-tip/remoteTips'
import { branchExistsTip, missingBranchTip, unmergedBranchTip } from './command-tip/branchTips'
import { emptyDiffTip, nothingStagedTip, unknownCommitTip, untypedMessageTip } from './command-tip/commitTips'
import { missingNameTip, notARepositoryTip, unknownCommandTip } from './command-tip/shellTips'

const EMPTY_FOLDER: FolderContents = { files: [], repositories: [] }

const TIP_RULES: readonly TipRule[] = [
  copiedPromptTip,
  copiedFullPromptTip,
  copiedNoteTip,
  curlyQuoteTip,
  unquotedMessageTip,
  unquotedNameTip,
  missingConfigScopeTip,
  newOnGitHubMainTip,
  mergeDirectionTip,
  mergeCurrentBranchTip,
  missingRemoteTip,
  remoteExistsTip,
  repositoryNotFoundTip,
  unmergedBranchTip,
  missingBranchTip,
  branchExistsTip,
  emptyDiffTip,
  unresolvedConflictTip,
  uncommittedBeforeMergeTip,
  unknownCommitTip,
  nothingStagedTip,
  untypedMessageTip,
  forcePushTip,
  cloneOwnerAndRepositoryTip,
  cloneSchemeTip,
  unknownCommandTip,
  missingNameTip,
  notARepositoryTip,
]

export function commandTip(line: string, outputs: readonly Output[], context: TipContext = {}): string | null {
  const input = {
    line,
    tokens: commandWords(line),
    outputs,
    branch: context.branch ?? null,
    folder: context.folder ?? EMPTY_FOLDER,
    newOnGitHubMain: context.newOnGitHubMain ?? false,
  }
  for (const rule of TIP_RULES) {
    const tip = rule(input)
    if (tip !== null) return tip
  }
  return null
}
