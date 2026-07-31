import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValue, hasFlag } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { commitSignature, currentBranch, headOid, shortOid } from '@/lib/git-sim/repository'
import { readCommitFiles, readIndexFiles } from '@/lib/git-sim/treeContents'
import { compareTrees, formatModeChanges, formatShortStat } from '@/lib/git-sim/diffStat'
import { readWorkingTree } from '@/lib/git-sim/workingTree'
import { formatStatus } from './status'
import { stageTrackedChanges } from './stageTracked'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

const NO_EDITOR = [
  'The sandbox has no text editor, so a commit message cannot be typed in one.',
  'Pass the message inline instead: git commit -m "your message"',
].join('\n')

async function previousFiles(
  ctx: CommandContext,
  dir: string,
  head: string | null,
): Promise<Map<string, string>> {
  return head ? readCommitFiles(ctx, dir, head) : new Map<string, string>()
}

export const commit: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    if (hasFlag(args, '--amend')) {
      throw new SandboxError('fatal: git commit --amend is not simulated in this course.')
    }

    const message = flagValue(args, '-m', '--message')
    if (message === undefined) throw new SandboxError(NO_EDITOR)
    if (message.trim() === '') throw new SandboxError('Aborting commit due to empty commit message.')

    if (hasFlag(args, '-a', '--all')) await stageTrackedChanges(ctx, dir)

    const tree = await readWorkingTree(ctx, dir)
    if (tree.staged.length === 0) throw new SandboxError(await formatStatus(ctx, dir))

    const head = await headOid(ctx, dir)
    const before = await previousFiles(ctx, dir, head)
    const after = await readIndexFiles(ctx, dir)
    const author = await commitSignature(ctx, dir)

    const oid = await git.commit({ fs: gitFs(ctx.fs), dir, message, author, committer: author })
    const branch = (await currentBranch(ctx, dir)) ?? 'HEAD'
    const rootLabel = head ? '' : ' (root-commit)'
    const deltas = compareTrees(before, after)

    return say(
      [
        `[${branch}${rootLabel} ${shortOid(oid)}] ${message}`,
        formatShortStat(deltas),
        ...formatModeChanges(deltas),
      ].join('\n'),
    )
  },
}
