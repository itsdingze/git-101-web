import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { flagValue, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { silent } from '@/lib/git-sim/output'
import { refOid } from '@/lib/git-sim/repository'
import { createAndSwitch, switchTo } from './switchBranch'
import { resolveTrackedPaths, restoreWorkdirEntries } from './restore'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const checkout: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const created = flagValue(args, '-b', '-B', '--branch')
    if (created) return createAndSwitch(ctx, dir, created)

    const separator = args.indexOf('--')
    const specs = separator === -1 ? operandsOf(args) : args.slice(separator + 1)
    const target = specs[0]
    if (!target) throw new SandboxError('fatal: missing branch or commit argument')

    const looksLikeBranch =
      separator === -1 && (await refOid(ctx, dir, `refs/heads/${target}`)) !== null
    if (looksLikeBranch) return switchTo(ctx, dir, target)

    const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
    if (separator === -1 && !tracked.includes(target) && target !== '.') {
      throw new SandboxError(`fatal: invalid reference: ${target}`)
    }

    await restoreWorkdirEntries(ctx, dir, await resolveTrackedPaths(ctx, dir, specs))
    return silent
  },
}
