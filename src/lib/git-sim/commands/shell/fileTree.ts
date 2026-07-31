import {
  copyTree,
  isDirectory,
  makeDirectory,
  pathExists,
  removeTree,
} from '@/lib/git-sim/fileOperations'
import { basename, joinPath, resolvePath } from '@/lib/git-sim/paths'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { fail, silent } from '@/lib/git-sim/output'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

export const mkdir: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return fail('mkdir: missing operand')

  const parents = hasFlag(args, '-p', '--parents')
  const outputs: CommandOutput[] = []

  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (await pathExists(ctx.fs, path)) {
      if (!parents) outputs.push({ text: `mkdir: cannot create directory '${target}': File exists`, stream: 'stderr' })
      continue
    }
    await makeDirectory(ctx.fs, path)
  }

  return outputs
}

export const rm: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  const force = hasFlag(args, '-f', '-rf', '-fr', '-Rf')
  const recursive = hasFlag(args, '-r', '-R', '-rf', '-fr', '-Rf')

  if (targets.length === 0) return force ? silent : fail('rm: missing operand')

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (!(await pathExists(ctx.fs, path))) {
      if (!force) outputs.push({ text: `rm: cannot remove '${target}': No such file or directory`, stream: 'stderr' })
      continue
    }
    if ((await isDirectory(ctx.fs, path)) && !recursive) {
      outputs.push({ text: `rm: cannot remove '${target}': Is a directory`, stream: 'stderr' })
      continue
    }
    if (path === ctx.root) {
      outputs.push({ text: `rm: refusing to remove '${target}': it is the sandbox root`, stream: 'stderr' })
      continue
    }
    await removeTree(ctx.fs, path)
  }

  return outputs
}

export const mv: CommandHandler = async (args, ctx) => {
  const [source, destination] = operandsOf(args)
  if (!source || !destination) return fail('mv: missing destination file operand')

  const from = resolvePath(source, ctx.cwd, ctx.root)
  if (!(await pathExists(ctx.fs, from))) {
    return fail(`mv: cannot stat '${source}': No such file or directory`)
  }

  const resolvedTarget = resolvePath(destination, ctx.cwd, ctx.root)
  const to = (await isDirectory(ctx.fs, resolvedTarget))
    ? joinPath(resolvedTarget, basename(from))
    : resolvedTarget

  await copyTree(ctx.fs, from, to)
  await removeTree(ctx.fs, from)
  return silent
}
