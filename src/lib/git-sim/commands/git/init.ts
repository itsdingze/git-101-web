import { makeDirectory } from '@/lib/git-sim/fs/fileOperations'
import { isValidBranchName } from '@/lib/git-sim/branch/branchNameRules'
import { SandboxError } from '@/lib/git-sim/errors'
import { initRepository } from '@/lib/git-sim/history/initRepository'
import { isRepository } from '@/lib/git-sim/history/repository'
import { joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import { silent, stdout } from '@/lib/git-sim/output'
import type { GitSubcommand } from '@/lib/git-sim/types'

export const init: GitSubcommand = {
  requiresRepo: false,
  options: { flags: ['-q', '--quiet'], valueFlags: ['-b', '--initial-branch'] },
  run: async (line, ctx) => {
    const branch = line.value('-b', '--initial-branch')
    if (branch !== undefined && !isValidBranchName(branch)) {
      throw new SandboxError(`fatal: invalid initial branch name: '${branch}'`)
    }

    const target = line.operands[0]
    const dir = target ? resolvePath(target, ctx.cwd, ctx.root) : ctx.cwd

    await makeDirectory(ctx.fs, dir)
    const existed = await isRepository(ctx, dir)
    await initRepository(ctx, dir, existed ? undefined : branch)

    const verb = existed ? 'Reinitialized existing' : 'Initialized empty'
    const warning = existed && branch ? [stdout(`warning: re-init: ignored --initial-branch=${branch}`)] : []
    if (line.has('-q', '--quiet')) return warning.length > 0 ? warning : silent
    return [...warning, stdout(`${verb} Git repository in ${joinPath(dir, '.git')}/`)]
  },
}
