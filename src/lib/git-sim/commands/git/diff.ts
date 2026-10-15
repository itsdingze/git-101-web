import git from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import { hasFlag, operandsOf } from '@/lib/git-sim/input/parseArgs'
import { firstUnknownOption, type KnownOptions } from '@/lib/git-sim/input/knownOptions'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import { matchAny, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readCommitFiles, readIndexFiles, readWorkdirFiles } from '@/lib/git-sim/working-tree/treeContents'
import { formatFileDiff } from '@/lib/git-sim/diff/unifiedDiff'
import { readUnmergedStages } from '@/lib/git-sim/working-tree/indexStages'
import { combinedDiffLines } from '@/lib/git-sim/diff/combinedDiff'
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

const DIFF_OPTIONS: KnownOptions = { flags: ['--staged', '--cached'] }

export const diff: GitSubcommand = {
  requiresRepo: true,
  run: async (args, ctx, dir) => {
    const unknown = firstUnknownOption(args, DIFF_OPTIONS)
    if (unknown) throw new SandboxError(`error: invalid option: ${unknown}`)

    const operands = operandsOf(args)
    const revisions = await leadingRevisions(ctx, dir, operands)
    const paths = operands.slice(revisions.length)

    const prefix = repoPrefix(ctx, dir)
    const sides = await sidesFor(ctx, dir, args, revisions)
    await rejectUnknownOperands(ctx, sides, paths, prefix)

    const staged = hasFlag(args, '--staged', '--cached')
    const unmerged = revisions.length === 0 ? await unmergedStagesIn(ctx, dir, paths, prefix) : new Map<string, Map<number, string>>()
    const settled = (files: ReadonlyMap<string, string>) =>
      new Map([...restrictTo(files, paths, prefix)].filter(([path]) => !unmerged.has(path)))
    const before = settled(sides.before)
    const after = settled(sides.after)

    const blocks: [string, string][] = []
    for (const path of new Set([...before.keys(), ...after.keys()])) {
      const patch = await formatFileDiff(path, before.get(path), after.get(path))
      if (patch) blocks.push([path, patch])
    }
    for (const [path, stages] of unmerged) {
      blocks.push([path, staged ? unmergedLine(path) : await conflictBlock(ctx, dir, path, stages)])
    }

    const text = blocks
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, block]) => block)
      .join('\n')
    return text ? say(text) : silent
  },
}

function unmergedLine(path: string): string {
  return `* Unmerged path ${path}`
}

async function stageText(ctx: CommandContext, dir: string, oid: string): Promise<string> {
  const { blob } = await git.readBlob({ fs: gitFs(ctx.fs), dir, oid })
  return new TextDecoder().decode(blob)
}

async function conflictBlock(
  ctx: CommandContext,
  dir: string,
  path: string,
  stages: ReadonlyMap<number, string>,
): Promise<string> {
  const ours = stages.get(2)
  const theirs = stages.get(3)
  if (ours === undefined || theirs === undefined) return unmergedLine(path)

  const absolute = joinPath(dir, path)
  const result = (await pathExists(ctx.fs, absolute)) ? await readText(ctx.fs, absolute) : ''
  return [
    `diff --cc ${path}`,
    `index ${ours.slice(0, 7)},${theirs.slice(0, 7)}..0000000`,
    `--- a/${path}`,
    `+++ b/${path}`,
    ...combinedDiffLines(await stageText(ctx, dir, ours), await stageText(ctx, dir, theirs), result),
  ].join('\n')
}

async function unmergedStagesIn(
  ctx: CommandContext,
  dir: string,
  paths: readonly string[],
  prefix: string,
): Promise<Map<string, Map<number, string>>> {
  const matches = paths.length === 0 ? () => true : matchAny(paths, prefix)
  return new Map([...(await readUnmergedStages(ctx, dir))].filter(([path]) => matches(path)))
}
