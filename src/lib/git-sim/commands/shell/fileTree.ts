import {
  copyTree,
  isDirectory,
  makeDirectory,
  parentFolderProblem,
  pathExists,
  removeTree,
} from '@/lib/git-sim/fileOperations'
import { basename, dirname, isInside, joinPath, resolvePath } from '@/lib/git-sim/paths'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { fail, silent } from '@/lib/git-sim/output'
import type { CommandContext, CommandHandler, CommandOutput } from '@/lib/git-sim/types'

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
    const problem = await parentFolderProblem(ctx.fs, path, parents)
    if (problem) {
      outputs.push({ text: `mkdir: cannot create directory '${target}': ${problem}`, stream: 'stderr' })
      continue
    }
    await makeDirectory(ctx.fs, path)
  }

  return outputs
}

function isDotEntry(target: string): boolean {
  const lastSegment = target.replace(/\/+$/, '').split('/').pop()
  return lastSegment === '.' || lastSegment === '..'
}

export const rm: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  const force = hasFlag(args, '-f', '-rf', '-fr', '-Rf')
  const recursive = hasFlag(args, '-r', '-R', '-rf', '-fr', '-Rf')

  if (targets.length === 0) return force ? silent : fail('rm: missing operand')

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    if (isDotEntry(target)) {
      outputs.push({ text: `rm: refusing to remove '.' or '..' directory: skipping '${target}'`, stream: 'stderr' })
      continue
    }
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
    if (isInside(ctx.cwd, path)) ctx.moveTo(dirname(path))
  }

  return outputs
}

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
