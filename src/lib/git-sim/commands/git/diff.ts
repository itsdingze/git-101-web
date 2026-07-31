import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { say, silent } from '@/lib/git-sim/output'
import { headOid } from '@/lib/git-sim/repository'
import { readCommitFiles, readIndexFiles, readWorkdirFiles } from '@/lib/git-sim/treeContents'
import { formatTreeDiff } from '@/lib/git-sim/unifiedDiff'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type Sides = {
  before: Map<string, string>
  after: Map<string, string>
}

async function headFiles(ctx: CommandContext, dir: string): Promise<Map<string, string>> {
  const head = await headOid(ctx, dir)
  return head ? readCommitFiles(ctx, dir, head) : new Map<string, string>()
}

async function workdirFiles(
  ctx: CommandContext,
  dir: string,
  index: ReadonlyMap<string, string>,
): Promise<Map<string, string>> {
  return readWorkdirFiles(ctx, dir, [...index.keys()])
}

async function sidesFor(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
): Promise<Sides> {
  const index = await readIndexFiles(ctx, dir)

  if (hasFlag(args, '--staged', '--cached')) {
    return { before: await headFiles(ctx, dir), after: index }
  }
  if (operandsOf(args).includes('HEAD')) {
    return { before: await headFiles(ctx, dir), after: await workdirFiles(ctx, dir, index) }
  }
  return { before: index, after: await workdirFiles(ctx, dir, index) }
}

function restrictTo(
  files: ReadonlyMap<string, string>,
  paths: readonly string[],
): Map<string, string> {
  if (paths.length === 0) return new Map(files)
  return new Map(
    [...files].filter(([path]) => paths.some((spec) => path === spec || path.startsWith(`${spec}/`))),
  )
}

export const diff: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const paths = operandsOf(args).filter((operand) => operand !== 'HEAD')
    const { before, after } = await sidesFor(ctx, dir, args)

    const patch = await formatTreeDiff(ctx, restrictTo(before, paths), restrictTo(after, paths))
    return patch ? say(patch) : silent
  },
}
