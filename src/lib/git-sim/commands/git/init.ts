import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/sandboxFs'
import { makeDirectory, pathExists } from '@/lib/git-sim/fileOperations'
import { joinPath, resolvePath } from '@/lib/git-sim/paths'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { say } from '@/lib/git-sim/output'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const init: GitSubcommand = {
  requiresRepo: false,
  run: async (args, ctx) => {
    const target = operandsOf(args)[0]
    const dir = target ? resolvePath(target, ctx.cwd, ctx.root) : ctx.cwd

    await makeDirectory(ctx.fs, dir)
    const existed = await pathExists(ctx.fs, joinPath(dir, '.git'))
    await git.init({ fs: gitFs(ctx.fs), dir, defaultBranch: 'main' })

    const verb = existed ? 'Reinitialized existing' : 'Initialized empty'
    return say(`${verb} Git repository in ${joinPath(dir, '.git')}/`)
  },
}
