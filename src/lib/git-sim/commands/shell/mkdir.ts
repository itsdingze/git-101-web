import { makeDirectory, parentFolderProblem, pathExists } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { fail, stderr } from '@/lib/git-sim/output'
import { hasBackslash, NO_BACKSLASH_NAMES } from '@/lib/git-sim/input/backslashNames'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

export const mkdir: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return fail('mkdir: missing operand')
  if (targets.some(hasBackslash)) return fail(NO_BACKSLASH_NAMES)

  const parents = hasFlag(args, '-p', '--parents')
  const outputs: CommandOutput[] = []

  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (await pathExists(ctx.fs, path)) {
      if (!parents) outputs.push(stderr(`mkdir: cannot create directory '${target}': File exists`))
      continue
    }
    const problem = await parentFolderProblem(ctx.fs, path, parents)
    if (problem) {
      outputs.push(stderr(`mkdir: cannot create directory '${target}': ${problem}`))
      continue
    }
    await makeDirectory(ctx.fs, path)
  }

  return outputs
}
