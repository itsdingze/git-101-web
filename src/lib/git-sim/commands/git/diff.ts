import type { CommandLine } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent } from '@/lib/git-sim/output'
import { pathExists, readText } from '@/lib/git-sim/fs/fileOperations'
import { joinPath, resolvePath } from '@/lib/git-sim/fs/paths'
import { matchAny, repoPrefix, specMatcher } from '@/lib/git-sim/fs/pathspec'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { bestMergeBases } from '@/lib/git-sim/merge/mergeBase'
import { blobText, readCommitFiles, readIndexFiles, readWorkdirFiles } from '@/lib/git-sim/working-tree/treeContents'
import { compareTrees, formatDiffStat, unmergedDelta } from '@/lib/git-sim/diff/diffStat'
import { formatFileDiff } from '@/lib/git-sim/diff/unifiedDiff'
import { readUnmergedStages } from '@/lib/git-sim/working-tree/indexStages'
import { combinedDiffLines } from '@/lib/git-sim/diff/combinedDiff'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

type Sides = {
  before: Map<string, string>
  after: Map<string, string>
}

const DEFAULT_CONTEXT_LINES = 3
const CONTEXT_FLAGS = ['-U', '--unified']
const PATCH_FLAGS = ['-p', '--patch']
const PARENT_FOLDER = '..'

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

async function rangeEnds(ctx: CommandContext, dir: string, spec: string): Promise<[string, string] | null> {
  const triple = spec.indexOf('...')
  if (triple !== -1) {
    const from = spec.slice(0, triple) || 'HEAD'
    const to = spec.slice(triple + 3) || 'HEAD'
    const fromOid = await resolveCommitish(ctx, dir, from)
    const toOid = await resolveCommitish(ctx, dir, to)
    if (!fromOid || !toOid) return null
    const [base] = await bestMergeBases(ctx, dir, fromOid, toOid)
    return base ? [base, toOid] : null
  }

  const double = spec.indexOf('..')
  if (double === -1 || spec === PARENT_FOLDER) return null
  const ends: [string, string] = [spec.slice(0, double) || 'HEAD', spec.slice(double + 2) || 'HEAD']
  const known = await Promise.all(ends.map((end) => resolveCommitish(ctx, dir, end)))
  return known.every(Boolean) ? ends : null
}

async function leadingRevisions(
  ctx: CommandContext,
  dir: string,
  operands: readonly string[],
): Promise<string[]> {
  const [first] = operands
  if (first !== undefined) {
    const range = await rangeEnds(ctx, dir, first)
    if (range) return range
  }

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
  line: CommandLine,
  revisions: readonly string[],
): Promise<Sides> {
  const staged = line.has('--staged', '--cached')
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

function contextLinesOf(line: CommandLine): number {
  const value = line.value(...CONTEXT_FLAGS)
  if (value === undefined) return DEFAULT_CONTEXT_LINES
  if (/^-\d+$/.test(value)) throw new SandboxError('error: --unified expects a non-negative integer')
  if (!/^\d+$/.test(value)) throw new SandboxError('error: --unified expects a numerical value')
  return Number(value)
}

function byPath([a]: [string, string], [b]: [string, string]): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function changedNames(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>, unmerged: readonly string[]): string[] {
  const paths = new Set([...before.keys(), ...after.keys()])
  const changed = [...paths].filter((path) => before.get(path) !== after.get(path))
  return [...changed, ...unmerged].sort()
}

async function statWithUnmerged(
  ctx: CommandContext,
  dir: string,
  settledDeltas: ReturnType<typeof compareTrees>,
  unmerged: ReadonlyMap<string, ReadonlyMap<number, string>>,
  staged: boolean,
): Promise<string> {
  const conflictRows = [...unmerged.keys()].map((path) => unmergedDelta(path))
  if (staged) return formatDiffStat([...conflictRows, ...settledDeltas].sort(byDeltaPath))

  const workingRows: ReturnType<typeof compareTrees> = []
  for (const [path, stages] of unmerged) {
    const ours = stages.get(2)
    if (ours === undefined) continue
    const absolute = joinPath(dir, path)
    const worktree = (await pathExists(ctx.fs, absolute)) ? await readText(ctx.fs, absolute) : undefined
    const after = new Map(worktree === undefined ? [] : [[path, worktree]])
    workingRows.push(...compareTrees(new Map([[path, await blobText(ctx, dir, ours)]]), after))
  }
  return formatDiffStat([...conflictRows, ...workingRows, ...settledDeltas].sort(byDeltaPath))
}

function byDeltaPath(a: { path: string }, b: { path: string }): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

function textOutput(text: string): CommandOutput[] {
  return text ? say(text) : silent
}

export const diff: GitSubcommand = {
  requiresRepo: true,
  options: {
    flags: ['--staged', '--cached', '--stat', '--name-only', ...PATCH_FLAGS],
    attachedValueFlags: CONTEXT_FLAGS,
    singleLetterOnly: true,
  },
  run: async (line, ctx, dir) => {
    const context = contextLinesOf(line)
    const revisions = await leadingRevisions(ctx, dir, line.beforeDashes)
    const typedPaths = line.beforeDashes.slice(rangeOperands(revisions, line))
    const paths = [...typedPaths, ...line.afterDashes]

    const prefix = repoPrefix(ctx, dir)
    const sides = await sidesFor(ctx, dir, line, revisions)
    await rejectUnknownOperands(ctx, sides, typedPaths, prefix)

    const staged = line.has('--staged', '--cached')
    const unmerged = revisions.length === 0 ? await unmergedStagesIn(ctx, dir, paths, prefix) : new Map<string, Map<number, string>>()
    const settled = (files: ReadonlyMap<string, string>) =>
      new Map([...restrictTo(files, paths, prefix)].filter(([path]) => !unmerged.has(path)))
    const before = settled(sides.before)
    const after = settled(sides.after)

    if (line.has('--name-only')) {
      const conflictNames = staged ? [...unmerged.keys()] : [...unmerged.keys(), ...unmerged.keys()]
      return textOutput(changedNames(before, after, conflictNames).join('\n'))
    }
    const stat = line.has('--stat') ? await statWithUnmerged(ctx, dir, compareTrees(before, after), unmerged, staged) : null
    if (stat !== null && !line.has(...PATCH_FLAGS, ...CONTEXT_FLAGS)) return textOutput(stat)

    const blocks: [string, string][] = []
    for (const path of new Set([...before.keys(), ...after.keys()])) {
      const patch = await formatFileDiff(path, before.get(path), after.get(path), context)
      if (patch) blocks.push([path, patch])
    }
    for (const [path, stages] of unmerged) {
      blocks.push([path, staged ? unmergedLine(path) : await conflictBlock(ctx, dir, path, stages)])
    }

    const patch = blocks.sort(byPath).map(([, block]) => block).join('\n')
    return textOutput(stat ? `${stat}\n\n${patch}` : patch)
  },
}

function rangeOperands(revisions: readonly string[], line: CommandLine): number {
  return revisions.length === 2 && line.beforeDashes[0]?.includes('..') ? 1 : revisions.length
}

function unmergedLine(path: string): string {
  return `* Unmerged path ${path}`
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
    ...combinedDiffLines(await blobText(ctx, dir, ours), await blobText(ctx, dir, theirs), result),
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
