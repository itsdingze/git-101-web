import git from 'isomorphic-git'
import type { ReadCommitResult } from 'isomorphic-git'
import { gitFs } from '@/lib/git-sim/fs/sandboxFs'
import type { CommandLine, KnownOptions } from '@/lib/git-sim/input/commandLine'
import { SandboxError } from '@/lib/git-sim/errors'
import { say, silent, stdout } from '@/lib/git-sim/output'
import { currentBranch, headOid, refOid } from '@/lib/git-sim/history/repository'
import { STASH_REF } from '@/lib/git-sim/stash/stashLog'
import { createCommitGraph, topoOrderCommits } from '@/lib/git-sim/history/commitGraph'
import { commitPatchLines, commitStatLines, type PathScope } from '@/lib/git-sim/history/commitChanges'
import { commitBlock, commitFormatOf, commitHeaderLines, separatedByBlank, type CommitFormat } from '@/lib/git-sim/history/commitFormat'
import { resolveCommitish } from '@/lib/git-sim/history/resolveCommitish'
import { readShallowBoundary, withoutHiddenParents } from '@/lib/git-sim/history/shallowBoundary'
import { bestMergeBases } from '@/lib/git-sim/merge/mergeBase'
import { readDecorations, type RefDecorations } from '@/lib/git-sim/history/decorations'
import { commitsTouching } from '@/lib/git-sim/history/touchedPaths'
import { matchAny, repoPrefix } from '@/lib/git-sim/fs/pathspec'
import { pathExists } from '@/lib/git-sim/fs/fileOperations'
import { resolvePath } from '@/lib/git-sim/fs/paths'
import type { CommandContext, CommandOutput, GitSubcommand } from '@/lib/git-sim/types'

const DEFAULT_DEPTH = 200
const VALUE_FLAGS = ['-n', '--max-count', '--grep', '--author']
const PATCH_FLAGS = ['-p', '--patch']

type LogOperands = { included: string[]; excluded: string[]; paths: string[] }

function countFlag(line: CommandLine): number | undefined {
  const value = line.value('-n', '--max-count')
  if (value === undefined) return undefined
  if (!/^[+-]?\d+$/.test(value)) throw new SandboxError(`fatal: '${value}': not an integer`)
  return Number(value)
}

function ambiguousArgument(spec: string): SandboxError {
  return new SandboxError(
    [
      `fatal: ambiguous argument '${spec}': unknown revision or path not in the working tree.`,
      "Use '--' to separate paths from revisions, like this:",
      "'git <command> [<revision>...] -- [<file>...]'",
    ].join('\n'),
  )
}

async function logOperands(ctx: CommandContext, dir: string, line: CommandLine): Promise<LogOperands> {
  const operands: LogOperands = { included: [], excluded: [], paths: [] }
  for (const operand of line.beforeDashes) {
    if (operands.paths.length === 0 && (await addRevision(ctx, dir, operand, operands))) continue
    if (!(await pathExists(ctx.fs, resolvePath(operand, ctx.cwd, ctx.root)))) throw ambiguousArgument(operand)
    operands.paths.push(operand)
  }
  return { ...operands, paths: [...operands.paths, ...line.afterDashes] }
}

async function addSymmetricRange(ctx: CommandContext, dir: string, operand: string, operands: LogOperands): Promise<boolean> {
  const [from = '', to = ''] = operand.split('...')
  const left = await resolveCommitish(ctx, dir, from || 'HEAD')
  const right = await resolveCommitish(ctx, dir, to || 'HEAD')
  if (!left || !right) return false

  operands.included.push(left, right)
  operands.excluded.push(...(await bestMergeBases(ctx, dir, left, right)))
  return true
}

async function addRevision(ctx: CommandContext, dir: string, operand: string, operands: LogOperands): Promise<boolean> {
  if (operand.includes('...')) return addSymmetricRange(ctx, dir, operand, operands)

  const range = operand.split('..')
  if (range.length === 2) {
    const [from = '', to = ''] = range
    const excluded = await resolveCommitish(ctx, dir, from || 'HEAD')
    const included = await resolveCommitish(ctx, dir, to || 'HEAD')
    if (!excluded || !included) return false
    operands.excluded.push(excluded)
    operands.included.push(included)
    return true
  }
  const oid = await resolveCommitish(ctx, dir, operand)
  if (oid) operands.included.push(oid)
  return oid !== null
}

async function reachableOids(ctx: CommandContext, dir: string, refs: readonly string[]): Promise<Map<string, ReadCommitResult>> {
  const byOid = new Map<string, ReadCommitResult>()
  const boundary = await readShallowBoundary(ctx, dir)
  for (const ref of refs) {
    const entries = await git.log({ fs: gitFs(ctx.fs), dir, ref, depth: DEFAULT_DEPTH })
    for (const entry of entries) byOid.set(entry.oid, withoutHiddenParents(entry, boundary))
  }
  return byOid
}

async function allRefs(ctx: CommandContext, dir: string): Promise<string[]> {
  const fs = gitFs(ctx.fs)
  const refs = (await git.listBranches({ fs, dir })).map((name) => `refs/heads/${name}`)
  for (const { remote } of await git.listRemotes({ fs, dir })) {
    for (const name of await git.listBranches({ fs, dir, remote })) refs.push(`refs/remotes/${remote}/${name}`)
  }
  if (await refOid(ctx, dir, STASH_REF)) refs.push(STASH_REF)
  return refs
}

async function collectCommits(
  ctx: CommandContext,
  dir: string,
  line: CommandLine,
  { included, excluded }: LogOperands,
): Promise<ReadCommitResult[]> {
  const starts = included.length > 0 ? included : ['HEAD']
  const refs = line.has('--all') ? await allRefs(ctx, dir) : starts
  const hidden = await reachableOids(ctx, dir, excluded)
  const shown = [...(await reachableOids(ctx, dir, refs)).values()].filter((entry) => !hidden.has(entry.oid))

  return shown.sort(
    (a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp,
  )
}

function applyFilters(
  commits: readonly ReadCommitResult[],
  line: CommandLine,
): ReadCommitResult[] {
  const grep = line.value('--grep')
  const author = line.value('--author')

  let filtered = [...commits]
  if (grep) filtered = filtered.filter((entry) => entry.commit.message.includes(grep))
  if (author) filtered = filtered.filter((entry) => entry.commit.author.name.includes(author))
  return filtered
}

function limited<T>(items: readonly T[], line: CommandLine): T[] {
  const count = countFlag(line)
  return count !== undefined && count >= 0 ? items.slice(0, count) : [...items]
}

type EntryRenderer = (entry: ReadCommitResult) => Promise<string[]>

function entryRenderer(
  ctx: CommandContext,
  dir: string,
  line: CommandLine,
  format: CommitFormat,
  decorations: RefDecorations,
  inScope: PathScope,
): EntryRenderer {
  const showsStat = line.has('--stat')
  const showsPatch = line.has(...PATCH_FLAGS)

  return async (entry) => {
    const sections =
      entry.commit.parent.length > 1
        ? []
        : [
            showsStat ? await commitStatLines(ctx, dir, entry, inScope) : [],
            showsPatch ? await commitPatchLines(ctx, dir, entry, inScope) : [],
          ]
    return commitBlock(commitHeaderLines(entry, format, decorations), sections, format, false)
  }
}

function terminatedOutput(format: CommitFormat, text: string): CommandOutput[] {
  if (format.kind === 'template' && !format.terminated) return [{ ...stdout(text), unterminated: true }]
  return say(text)
}

async function renderPlain(
  commits: readonly ReadCommitResult[],
  format: CommitFormat,
  render: EntryRenderer,
): Promise<CommandOutput[]> {
  const blocks: string[][] = []
  for (const entry of commits) blocks.push(await render(entry))

  const joined = separatedByBlank(format) ? blocks.map((block) => block.join('\n')).join('\n\n') : blocks.flat().join('\n')
  const text = format.kind === 'template' ? joined : joined.trimEnd()
  return text ? terminatedOutput(format, text) : silent
}

async function renderGraph(
  commits: readonly ReadCommitResult[],
  format: CommitFormat,
  render: EntryRenderer,
  line: CommandLine,
): Promise<CommandOutput[]> {
  const byOid = new Map(commits.map((entry) => [entry.oid, entry]))
  const ordered = topoOrderCommits(
    commits.map((entry) => ({ oid: entry.oid, parents: entry.commit.parent })),
  )
  const graph = createCommitGraph(ordered)

  const rows: string[] = []
  for (const [index, commit] of limited(ordered, line).entries()) {
    const entry = byOid.get(commit.oid)
    if (!entry) continue
    rows.push(...graph.draw(commit, await render(entry), separatedByBlank(format) && index > 0))
  }
  return say(rows.map((row) => row.trimEnd()).join('\n').trimEnd())
}

const LOG_OPTIONS: KnownOptions = {
  flags: ['--oneline', '--graph', '--all', '--no-decorate', '--decorate', '--stat', '--reverse', ...PATCH_FLAGS],
  valueFlags: VALUE_FLAGS,
  attachedValueFlags: ['--format', '--pretty'],
  countShorthand: true,
  singleLetterOnly: true,
}

export const log: GitSubcommand = {
  requiresRepo: true,
  options: LOG_OPTIONS,
  run: async (line, ctx, dir) => {
    countFlag(line)
    if (line.has('--reverse') && line.has('--graph')) {
      throw new SandboxError("fatal: options '--graph' and '--reverse' cannot be used together")
    }
    const format = commitFormatOf(line)

    if (!(await headOid(ctx, dir))) {
      const branch = (await currentBranch(ctx, dir)) ?? 'main'
      throw new SandboxError(`fatal: your current branch '${branch}' does not have any commits yet`)
    }

    const operands = await logOperands(ctx, dir, line)
    const { paths } = operands
    const inScope: PathScope = paths.length === 0 ? () => true : matchAny(paths, repoPrefix(ctx, dir))
    const history = await collectCommits(ctx, dir, line, operands)
    const touching = paths.length === 0 ? history : await commitsTouching(ctx, dir, history, inScope)
    const commits = applyFilters(touching, line)
    if (commits.length === 0) return silent

    const decorations = line.has('--no-decorate')
      ? new Map<string, string[]>()
      : await readDecorations(ctx, dir)
    const render = entryRenderer(ctx, dir, line, format, decorations, inScope)

    if (line.has('--graph')) return renderGraph(commits, format, render, line)

    const shown = limited(commits, line)
    return renderPlain(line.has('--reverse') ? [...shown].reverse() : shown, format, render)
  },
}
