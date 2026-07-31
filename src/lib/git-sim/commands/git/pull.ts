import { operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { currentBranch } from '@/lib/git-sim/repository'
import { fetchFromRemote, resolveRemoteName } from './fetch'
import { mergeInto } from './merge'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const pull: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const operands = operandsOf(args)
    const branchName = await currentBranch(ctx, dir)
    if (!branchName) throw new SandboxError('fatal: cannot pull onto a detached HEAD in this course.')

    const remoteName = operands[0] ?? (await resolveRemoteName(ctx, dir))
    const branch = operands[1] ?? branchName

    const result = await fetchFromRemote(ctx, dir, remoteName, branch)
    if (!result.fetchedOid) {
      return say([result.header, `fatal: couldn't find remote ref ${branch}`].join('\n'))
    }

    const merged = await mergeInto(ctx, dir, `refs/remotes/${remoteName}/${branch}`)
    return say([result.header, merged].join('\n'))
  },
}
