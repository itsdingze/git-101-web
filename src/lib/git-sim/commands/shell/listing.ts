import { isDirectory, listEntries, pathExists } from '@/lib/git-sim/fileOperations'
import { basename, resolvePath } from '@/lib/git-sim/paths'
import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { fail, say, silent } from '@/lib/git-sim/output'
import type { CommandHandler } from '@/lib/git-sim/types'

export const ls: CommandHandler = async (args, ctx) => {
  const target = operandsOf(args)[0]
  const path = target ? resolvePath(target, ctx.cwd, ctx.root) : ctx.cwd

  if (!(await pathExists(ctx.fs, path))) {
    return fail(`ls: cannot access '${target ?? ''}': No such file or directory`)
  }
  if (!(await isDirectory(ctx.fs, path))) return say(basename(path))

  const showHidden = hasFlag(args, '-a', '-A', '-la', '-al')
  const entries = (await listEntries(ctx.fs, path)).filter(
    (entry) => showHidden || !entry.name.startsWith('.'),
  )

  if (entries.length === 0) return silent
  if (hasFlag(args, '-l', '-la', '-al')) {
    return say(entries.map((entry) => (entry.directory ? `${entry.name}/` : entry.name)).join('\n'))
  }

  return say(entries.map((entry) => entry.name).join('  '))
}
