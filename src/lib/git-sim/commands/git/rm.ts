import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say } from '@/lib/git-sim/output'
import { joinPath } from '@/lib/git-sim/paths'
import { pathExists, removeTree } from '@/lib/git-sim/fileOperations'
import { repoPrefix, specMatcher } from '@/lib/git-sim/pathspec'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const rm: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const specs = operandsOf(args)
    if (specs.length === 0) throw new SandboxError('fatal: No pathspec was given. Which files should I remove?')

    const recursive = hasFlag(args, '-r', '-R', '--recursive')
    const cachedOnly = hasFlag(args, '--cached')
    const prefix = repoPrefix(ctx, dir)
    const tracked = await git.listFiles({ fs: gitFs(ctx.fs), dir })
    const removed: string[] = []

    for (const spec of specs) {
      const matches = specMatcher(spec, prefix)
      const hits = tracked.filter(matches)
      if (hits.length === 0) {
        throw new SandboxError(`fatal: pathspec '${spec}' did not match any files`)
      }
      if (hits.length > 1 && !recursive) {
        throw new SandboxError(`fatal: not removing '${spec}' recursively without -r`)
      }
      removed.push(...hits)
    }

    for (const path of new Set(removed)) {
      await git.remove({ fs: gitFs(ctx.fs), dir, filepath: path })
      if (cachedOnly) continue

      const absolute = joinPath(dir, path)
      if (await pathExists(ctx.fs, absolute)) await removeTree(ctx.fs, absolute)
    }

    const cleanup = [...new Set(removed)].map((path) => `rm '${path}'`)
    return say(cleanup.join('\n'))
  },
}
