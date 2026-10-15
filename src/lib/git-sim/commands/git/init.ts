import { makeDirectory } from '@/lib/git-sim/fs/fileOperations'
import { initRepository } from '@/lib/git-sim/history/initRepository'
import { isRepository } from '@/lib/git-sim/history/repository'
import { joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { say } from '@/lib/git-sim/output'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const init: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const target = operandsOf(args)[0]
    const dir = target ? resolvePath(target, ctx.cwd, ctx.root) : ctx.cwd

    await makeDirectory(ctx.fs, dir)
    const existed = await isRepository(ctx, dir)
    await initRepository(ctx, dir)

    const verb = existed ? 'Reinitialized existing' : 'Initialized empty'
    return say(`${verb} Git repository in ${joinPath(dir, '.git')}/`)
  },
}
