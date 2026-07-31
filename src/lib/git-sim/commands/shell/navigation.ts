import { isDirectory, pathExists } from '@/lib/git-sim/fileOperations'
import { resolvePath } from '@/lib/git-sim/paths'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { say, silent } from '@/lib/git-sim/output'
import type { CommandHandler } from '@/lib/git-sim/types'

export const cd: CommandHandler = async (args, ctx) => {
  const target = operandsOf(args)[0]
  const destination = target ? resolvePath(target, ctx.cwd, ctx.root) : ctx.root

  if (!(await pathExists(ctx.fs, destination))) {
    return [{ text: `bash: cd: ${target ?? ''}: No such file or directory`, stream: 'stderr' }]
  }
  if (!(await isDirectory(ctx.fs, destination))) {
    return [{ text: `bash: cd: ${target ?? ''}: Not a directory`, stream: 'stderr' }]
  }

  ctx.moveTo(destination)
  return silent
}

export const pwd: CommandHandler = (_args, ctx) => Promise.resolve(say(ctx.cwd))
