import { isDirectory, pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { dirname, isInside, resolvePath } from '@/lib/git-sim/fs/paths'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { fail, silent, stderr } from '@/lib/git-sim/output'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

function isDotEntry(target: string): boolean {
  const lastSegment = target.replace(/\/+$/, '').split('/').pop()
  return lastSegment === '.' || lastSegment === '..'
}

export const rm: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  const force = hasFlag(args, '-f')
  const recursive = hasFlag(args, '-r', '-R')

  if (targets.length === 0) return force ? silent : fail('rm: missing operand')

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    if (isDotEntry(target)) {
      outputs.push(stderr(`rm: refusing to remove '.' or '..' directory: skipping '${target}'`))
      continue
    }
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (!(await pathExists(ctx.fs, path))) {
      if (!force) outputs.push(stderr(`rm: cannot remove '${target}': No such file or directory`))
      continue
    }
    if ((await isDirectory(ctx.fs, path)) && !recursive) {
      outputs.push(stderr(`rm: cannot remove '${target}': Is a directory`))
      continue
    }
    if (path === ctx.root) {
      outputs.push(stderr(`rm: refusing to remove '${target}': it's your home folder`))
      continue
    }
    await removeTree(ctx.fs, path)
    if (isInside(ctx.cwd, path)) ctx.moveTo(dirname(path))
  }

  return outputs
}
