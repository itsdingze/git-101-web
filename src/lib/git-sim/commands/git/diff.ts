import { hasFlag, operandsOf } from '@/lib/git-sim/parseArgs'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { pathExists } from '@/lib/git-sim/fileOperations'
import { resolvePath } from '@/lib/git-sim/paths'
import { matchAny, repoPrefix, specMatcher } from '@/lib/git-sim/pathspec'
import { resolveCommitish } from '@/lib/git-sim/resolveCommitish'
import { readCommitFiles, readIndexFiles, readWorkdirFiles } from '@/lib/git-sim/treeContents'
import { formatTreeDiff } from '@/lib/git-sim/unifiedDiff'
import type { CommandContext, GitSubcommand } from '@/lib/git-sim/types'

type Sides = {
  before: Map<string, string>
  after: Map<string, string>
}

async function filesAt(
  ctx: CommandContext,
  dir: string,
  spec: string,
): Promise<Map<string, string>> {
  const oid = await resolveCommitish(ctx, dir, spec)
  return oid ? readCommitFiles(ctx, dir, oid) : new Map<string, string>()
}

async function workdirFiles(
  ctx: CommandContext,
  dir: string,
  index: ReadonlyMap<string, string>,
): Promise<Map<string, string>> {
  return readWorkdirFiles(ctx, dir, [...index.keys()])
}

async function leadingRevisions(
  ctx: CommandContext,
  dir: string,
  operands: readonly string[],
): Promise<string[]> {
  const revisions: string[] = []
  for (const operand of operands.slice(0, 2)) {
    if (operand !== 'HEAD' && !(await resolveCommitish(ctx, dir, operand))) break
    revisions.push(operand)
  }
  return revisions
}

async function revisionSides(
  ctx: CommandContext,
  dir: string,
  revisions: readonly string[],
  staged: boolean,
): Promise<Sides> {
  const [first = 'HEAD', second] = revisions
  const before = await filesAt(ctx, dir, first)
  if (second) return { before, after: await filesAt(ctx, dir, second) }

  const index = await readIndexFiles(ctx, dir)
  return { before, after: staged ? index : await workdirFiles(ctx, dir, index) }
}

async function sidesFor(
  ctx: CommandContext,
  dir: string,
  args: readonly string[],
  revisions: readonly string[],
): Promise<Sides> {
  const staged = hasFlag(args, '--staged', '--cached')
  if (revisions.length > 0) return revisionSides(ctx, dir, revisions, staged)

  const index = await readIndexFiles(ctx, dir)
  if (staged) return { before: await filesAt(ctx, dir, 'HEAD'), after: index }
  return { before: index, after: await workdirFiles(ctx, dir, index) }
}

function knownToSides(sides: Sides, spec: string, prefix: string): boolean {
  const matches = specMatcher(spec, prefix)
  return [...sides.before.keys(), ...sides.after.keys()].some(matches)
}

async function rejectUnknownOperands(
  ctx: CommandContext,
  sides: Sides,
  paths: readonly string[],
  prefix: string,
): Promise<void> {
  for (const spec of paths) {
    if (knownToSides(sides, spec, prefix)) continue
    if (await pathExists(ctx.fs, resolvePath(spec, ctx.cwd, ctx.root))) continue
    throw new SandboxError(
      `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
    )
  }
}

function restrictTo(
  files: ReadonlyMap<string, string>,
  paths: readonly string[],
  prefix: string,
): Map<string, string> {
  if (paths.length === 0) return new Map(files)
  const matches = matchAny(paths, prefix)
  return new Map([...files].filter(([path]) => matches(path)))
}

export const diff: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const operands = operandsOf(args)
    const revisions = await leadingRevisions(ctx, dir, operands)
    const paths = operands.slice(revisions.length)

    const prefix = repoPrefix(ctx, dir)
    const sides = await sidesFor(ctx, dir, args, revisions)
    await rejectUnknownOperands(ctx, sides, paths, prefix)

    const patch = await formatTreeDiff(
      ctx,
      restrictTo(sides.before, paths, prefix),
      restrictTo(sides.after, paths, prefix),
    )
    return patch ? say(patch) : silent
  },
}
