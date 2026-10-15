import { isDirectory, pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { silent, stderr, stdout } from '@/lib/git-sim/output'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

export const cat: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return silent

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (!(await pathExists(ctx.fs, path))) {
      outputs.push(stderr(`cat: ${target}: No such file or directory`))
      continue
    }
    if (await isDirectory(ctx.fs, path)) {
      outputs.push(stderr(`cat: ${target}: Is a directory`))
      continue
    }
    outputs.push(stdout((await readText(ctx.fs, path)).replace(/\n$/, '')))
  }
  return outputs
}
