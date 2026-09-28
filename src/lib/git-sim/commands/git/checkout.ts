import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { flagValue, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { refOid } from '@/lib/git-sim/history/repository'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { createAndSwitch, detachedHead, switchTo } from './switchBranch'
import { checkoutFromSource, refuseUnmergedPaths, resolveTrackedPaths, restoreWorkdirEntries } from './restore'
import type { GitSubcommand } from '@/lib/git-sim/types'

const BRANCH_FLAGS = ['-b', '-B', '--branch']

export const checkout: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const created = flagValue(args, ...BRANCH_FLAGS)
    if (created) return createAndSwitch(ctx, dir, created, operandsOf(args, BRANCH_FLAGS)[0])

    const separator = args.indexOf('--')
    const source = separator === -1 ? undefined : operandsOf(args.slice(0, separator))[0]
    if (source) {
      await checkoutFromSource(ctx, dir, source, args.slice(separator + 1))
      return silent
    }

    const specs = separator === -1 ? operandsOf(args) : args.slice(separator + 1)
    const target = specs[0]
    if (!target) throw new SandboxError('fatal: missing branch or commit argument')

    const looksLikeBranch =
      separator === -1 && (await refOid(ctx, dir, `refs/heads/${target}`)) !== null
    if (looksLikeBranch) return switchTo(ctx, dir, target)

    const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
    if (separator === -1 && !tracked.includes(target) && target !== '.') {
      const commit = await resolveCommitish(ctx, dir, target)
      if (commit && specs.length > 1) {
        await checkoutFromSource(ctx, dir, target, specs.slice(1))
        return silent
      }
      if (commit) throw new SandboxError(detachedHead(target, commit))
    }

    const paths = await resolveTrackedPaths(ctx, dir, specs)
    await refuseUnmergedPaths(ctx, dir, paths)
    await restoreWorkdirEntries(ctx, dir, paths)
    return silent
  },
}
