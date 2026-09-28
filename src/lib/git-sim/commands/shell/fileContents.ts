import {
  isDirectory,
  parentFolderProblem,
  pathExists,
  readText,
  writeText,
} from '@/lib/git-sim/fileOperations'
import { resolvePath } from '@/lib/git-sim/paths'
import { operandsOf } from '@/lib/git-sim/parseArgs'
import { fail, say, silent } from '@/lib/git-sim/output'
import type { CommandHandler, CommandOutput } from '@/lib/git-sim/types'

export const cat: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return silent

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (!(await pathExists(ctx.fs, path))) {
      outputs.push({ text: `cat: ${target}: No such file or directory`, stream: 'stderr' })
      continue
    }
    if (await isDirectory(ctx.fs, path)) {
      outputs.push({ text: `cat: ${target}: Is a directory`, stream: 'stderr' })
      continue
    }
    outputs.push({ text: (await readText(ctx.fs, path)).replace(/\n$/, ''), stream: 'stdout' })
  }
  return outputs
}

export const echo: CommandHandler = (args) => Promise.resolve(say(args.join(' ')))

export const touch: CommandHandler = async (args, ctx) => {
  const targets = operandsOf(args)
  if (targets.length === 0) return fail('touch: missing file operand')

  const outputs: CommandOutput[] = []
  for (const target of targets) {
    const path = resolvePath(target, ctx.cwd, ctx.root)
    if (await pathExists(ctx.fs, path)) continue

    const problem = await parentFolderProblem(ctx.fs, path, false)
    if (problem) {
      outputs.push({ text: `touch: cannot touch '${target}': ${problem}`, stream: 'stderr' })
      continue
    }
    await writeText(ctx.fs, path, '')
  }
  return outputs
}
