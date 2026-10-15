import { copyTree, isDirectory, pathExists, removeTree } from '@/lib/git-sim/fs/fileOperations'
import { basename, dirname, isInside, joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import { operandsOf } from '@/lib/git-sim/input/parseArgs'
import { fail, silent } from '@/lib/git-sim/output'
import { hasBackslash, NO_BACKSLASH_NAMES } from '@/lib/git-sim/input/backslashNames'
import type { CommandContext, CommandHandler } from '@/lib/git-sim/types'

type MovePlan = {
  source: string
  destination: string
  from: string
  to: string
  intoDirectory: boolean
}

async function moveProblem(ctx: CommandContext, plan: MovePlan): Promise<string | null> {
  const { source, destination, from, to, intoDirectory } = plan

  if (to === from) return `mv: '${source}' and '${destination}' are the same file`
  if (to.startsWith(`${from}/`)) {
    const shownTarget = intoDirectory ? `${destination}/${basename(from)}` : destination
    return `mv: cannot move '${source}' to a subdirectory of itself, '${shownTarget}'`
  }

  const parent = dirname(to)
  if (!(await pathExists(ctx.fs, parent))) {
    return `mv: cannot move '${source}' to '${destination}': No such file or directory`
  }
  if (!(await isDirectory(ctx.fs, parent))) {
    return `mv: cannot move '${source}' to '${destination}': Not a directory`
  }

  const targetIsFile = (await pathExists(ctx.fs, to)) && !(await isDirectory(ctx.fs, to))
  if (targetIsFile && (await isDirectory(ctx.fs, from))) {
    return `mv: cannot overwrite non-directory '${destination}' with directory '${source}'`
  }
  return null
}

export const mv: CommandHandler = async (args, ctx) => {
  const [source, destination] = operandsOf(args)
  if (!source || !destination) return fail('mv: missing destination file operand')
  if (hasBackslash(destination)) return fail(NO_BACKSLASH_NAMES)

  const from = resolvePath(source, ctx.cwd, ctx.root)
  if (!(await pathExists(ctx.fs, from))) {
    return fail(`mv: cannot stat '${source}': No such file or directory`)
  }

  const resolvedTarget = resolvePath(destination, ctx.cwd, ctx.root)
  const intoDirectory = await isDirectory(ctx.fs, resolvedTarget)
  const to = intoDirectory ? joinPath(resolvedTarget, basename(from)) : resolvedTarget

  const problem = await moveProblem(ctx, { source, destination, from, to, intoDirectory })
  if (problem) return fail(problem)

  await copyTree(ctx.fs, from, to)
  await removeTree(ctx.fs, from)
  if (isInside(ctx.cwd, from)) ctx.moveTo(`${to}${ctx.cwd.slice(from.length)}`)
  return silent
}
