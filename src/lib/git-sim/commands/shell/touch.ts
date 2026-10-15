import { parentFolderProblem, pathExists, writeText } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { fail, stderr } from '@/lib/git-sim/output'
import { hasBackslash, NO_BACKSLASH_NAMES } from '@/lib/git-sim/input/backslashNames'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

export const touch: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return fail('touch: missing file operand')
  if (targets.some(hasBackslash)) return fail(NO_BACKSLASH_NAMES)

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (await pathExists(ctx.fs, path)) continue

    const problem = await parentFolderProblem(ctx.fs, path, false)
    if (problem) {
      outputs.push(stderr(`touch: cannot touch '${target}': ${problem}`))
      continue
    }
    await writeText(ctx.fs, path, '')
  }
  return outputs
}
